from modules.warehouse.domain.entities.stock_movement import StockMovement
from modules.warehouse.domain.interfaces.repositories.i_stock_movement_repository import (
    IStockMovementRepository,
)
from modules.warehouse.domain.interfaces.repositories.i_warehouse_stock_repository import (
    IWarehouseStockRepository,
)
from shared.domain.interfaces.i_product_stock_updater import IProductStockUpdater
from shared.domain.interfaces.i_stock_output_recorder import IStockOutputRecorder


class StockOutputRecorder(IStockOutputRecorder):
    """Records an outbound stock movement for a single product in a warehouse.

    Symmetric to StockEntryRecorder: subtracts quantity from existing stock
    instead of adding it. Used by the sales module when a sale is Delivered.

    When update_global=False the global product.stock_current is NOT updated
    here because the sales Approve step already decremented it (reservation).
    """

    def __init__(
        self,
        stock_repo: IWarehouseStockRepository,
        movement_repo: IStockMovementRepository,
        stock_updater: IProductStockUpdater,
    ) -> None:
        self._stock_repo = stock_repo
        self._movement_repo = movement_repo
        self._stock_updater = stock_updater

    async def remove_stock(
        self,
        warehouse_id: int,
        product_id: int,
        quantity: int,
        user_email: str,
        reason: str,
        update_global: bool = True,
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
            user_email=user_email,
        )
        await self._movement_repo.create(movement)

        if update_global:
            global_stock = await self._stock_repo.get_global_stock(product_id)
            await self._stock_updater.update_stock_current(product_id, global_stock)
