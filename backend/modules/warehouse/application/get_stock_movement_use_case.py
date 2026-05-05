from modules.warehouse.domain.dtos.stock_movement_detail import StockMovementDetail
from modules.warehouse.domain.exceptions import (
    WarehouseException,
    WarehouseExceptionInfo,
)
from modules.warehouse.domain.interfaces.repositories.i_stock_movement_repository import (
    IStockMovementRepository,
)
from modules.warehouse.domain.interfaces.use_cases.i_get_stock_movement_use_case import (
    IGetStockMovementUseCase,
)


class GetStockMovementUseCase(IGetStockMovementUseCase):
    """Return the full detail of a single stock movement."""

    def __init__(self, movement_repo: IStockMovementRepository) -> None:
        self._movement_repo = movement_repo

    async def execute(self, movement_id: int) -> StockMovementDetail:
        row = await self._movement_repo.get_by_id(movement_id)
        if row is None:
            raise WarehouseException(WarehouseExceptionInfo.MOVEMENT_NOT_FOUND)
        movement, product_name, warehouse_name = row
        return StockMovementDetail(
            movement_id=movement.movement_id,
            warehouse_id=movement.warehouse_id,
            warehouse_name=warehouse_name,
            product_id=movement.product_id,
            product_name=product_name,
            movement_type=movement.movement_type,
            previous_quantity=movement.previous_quantity,
            new_quantity=movement.new_quantity,
            difference=movement.difference,
            reason=movement.reason,
            purchase_id=movement.purchase_id,
            sale_id=movement.sale_id,
            user_email=movement.user_email,
            created_at=movement.created_at,
        )
