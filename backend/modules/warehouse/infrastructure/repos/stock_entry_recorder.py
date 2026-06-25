from modules.warehouse.domain.entities.stock_movement import StockMovement
from modules.warehouse.domain.interfaces.repositories.i_stock_movement_repository import (
    IStockMovementRepository,
)
from modules.warehouse.domain.interfaces.repositories.i_warehouse_stock_repository import (
    IWarehouseStockRepository,
)
from shared.domain.interfaces.i_stock_entry_recorder import IStockEntryRecorder


class StockEntryRecorder(IStockEntryRecorder):
    """Records an inbound stock entry for a single product in a warehouse.

    Analogous to AdjustStockUseCase but for purchase receipts: adds the
    received quantity to the existing stock instead of setting an absolute value.
    Product.stock_current is computed automatically via a column_property.
    """

    def __init__(
        self,
        stock_repo: IWarehouseStockRepository,
        movement_repo: IStockMovementRepository,
    ) -> None:
        self._stock_repo = stock_repo
        self._movement_repo = movement_repo

    async def add_stock(
        self,
        warehouse_id: int,
        product_id: int,
        quantity: int,
        user_email: str,
        reason: str,
        purchase_id: int | None = None,
    ) -> None:
        current = await self._stock_repo.get_by_warehouse_and_product(
            warehouse_id, product_id
        )
        prev = current.stock if current else 0
        new_qty = prev + quantity

        await self._stock_repo.upsert_stock(warehouse_id, product_id, new_qty)

        movement = StockMovement(
            warehouse_id=warehouse_id,
            product_id=product_id,
            movement_type="inbound",
            previous_quantity=prev,
            new_quantity=new_qty,
            difference=quantity,
            reason=reason,
            purchase_id=purchase_id,
            user_email=user_email,
        )
        await self._movement_repo.create(movement)
