from modules.warehouse.domain.adjust_stock_result import AdjustStockResult
from modules.warehouse.domain.entities.stock_movement import StockMovement
from modules.warehouse.domain.exceptions import (
    WarehouseException,
    WarehouseExceptionInfo,
)
from modules.warehouse.domain.interfaces.repositories.i_stock_movement_repository import (
    IStockMovementRepository,
)
from modules.warehouse.domain.interfaces.repositories.i_warehouse_repository import (
    IWarehouseRepository,
)
from modules.warehouse.domain.interfaces.repositories.i_warehouse_stock_repository import (
    IWarehouseStockRepository,
)
from modules.warehouse.domain.interfaces.use_cases.i_adjust_stock_use_case import (
    IAdjustStockUseCase,
)
from shared.domain.interfaces.i_product_reader import IProductReader
from shared.domain.interfaces.i_product_stock_updater import IProductStockUpdater


class AdjustStockUseCase(IAdjustStockUseCase):
    """Adjust stock for a product in a specific warehouse.

    Creates an auditable StockMovement record and updates the product's
    global stock_current across all warehouses.
    """

    def __init__(
        self,
        warehouse_repo: IWarehouseRepository,
        stock_repo: IWarehouseStockRepository,
        movement_repo: IStockMovementRepository,
        product_reader: IProductReader,
        stock_updater: IProductStockUpdater,
    ) -> None:
        self._warehouse_repo = warehouse_repo
        self._stock_repo = stock_repo
        self._movement_repo = movement_repo
        self._product_reader = product_reader
        self._stock_updater = stock_updater

    async def execute(
        self,
        warehouse_id: int,
        product_id: int,
        new_quantity: int,
        user_email: str,
        reason: str | None = None,
    ) -> AdjustStockResult:
        # 1. Validate warehouse exists
        warehouse = await self._warehouse_repo.get_by_id(warehouse_id)
        if warehouse is None:
            raise WarehouseException(WarehouseExceptionInfo.WAREHOUSE_NOT_FOUND)

        # 2. Validate product exists and is active
        product = await self._product_reader.get_by_id(product_id)
        if product is None:
            raise WarehouseException(WarehouseExceptionInfo.PRODUCT_NOT_FOUND)
        if not product.is_active:
            raise WarehouseException(WarehouseExceptionInfo.PRODUCT_NOT_ACTIVE)

        # 3. Get current stock (0 if no record exists yet)
        current_record = await self._stock_repo.get_by_warehouse_and_product(
            warehouse_id, product_id
        )
        previous_quantity = current_record.stock if current_record else 0

        # 4. Upsert new stock value
        await self._stock_repo.upsert_stock(warehouse_id, product_id, new_quantity)

        # 5. Create StockMovement record
        movement = StockMovement(
            warehouse_id=warehouse_id,
            product_id=product_id,
            movement_type="adjustment",
            previous_quantity=previous_quantity,
            new_quantity=new_quantity,
            difference=new_quantity - previous_quantity,
            reason=reason,
            user_email=user_email,
        )
        movement = await self._movement_repo.create(movement)

        # 6. Recalculate global stock and update Product.stock_current
        global_stock = await self._stock_repo.get_global_stock(product_id)
        await self._stock_updater.update_stock_current(product_id, global_stock)

        return AdjustStockResult(
            movement_id=movement.movement_id,
            warehouse_id=warehouse_id,
            product_id=product_id,
            previous_quantity=previous_quantity,
            new_quantity=new_quantity,
            difference=new_quantity - previous_quantity,
            global_stock=global_stock,
            created_at=movement.created_at,
        )
