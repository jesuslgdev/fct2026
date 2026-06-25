from modules.warehouse.domain.entities.stock_movement import StockMovement
from modules.warehouse.domain.interfaces.repositories.i_stock_movement_repository import (
    IStockMovementRepository,
)
from modules.warehouse.domain.interfaces.repositories.i_warehouse_stock_repository import (
    IWarehouseStockRepository,
)
from shared.domain.interfaces.i_stock_output_recorder import IStockOutputRecorder


class StockOutputRecorder(IStockOutputRecorder):
    """Records an outbound stock movement for a single product in a warehouse.

    Symmetric to StockEntryRecorder: subtracts quantity from warehouse_stock.
    stock_current on Product is a computed column_property and updates
    automatically once the warehouse_stock row is modified.
    """

    def __init__(
        self,
        stock_repo: IWarehouseStockRepository,
        movement_repo: IStockMovementRepository,
    ) -> None:
        self._stock_repo = stock_repo
        self._movement_repo = movement_repo

    async def remove_stock(
        self,
        warehouse_id: int,
        product_id: int,
        quantity: int,
        user_email: str,
        reason: str,
        sale_id: int | None = None,
    ) -> None:
        current = await self._stock_repo.get_by_warehouse_and_product(
            warehouse_id, product_id
        )
        prev = current.stock if current else 0
        new_qty = max(prev - quantity, 0)

        await self._stock_repo.upsert_stock(warehouse_id, product_id, new_qty)

        movement = StockMovement(
            warehouse_id=warehouse_id,
            product_id=product_id,
            movement_type="outbound",
            previous_quantity=prev,
            new_quantity=new_qty,
            difference=-quantity,
            reason=reason,
            sale_id=sale_id,
            user_email=user_email,
        )
        await self._movement_repo.create(movement)
