from modules.warehouse.domain.interfaces.repositories.i_warehouse_stock_repository import (
    IWarehouseStockRepository,
)
from shared.domain.interfaces.i_stock_reservation_recorder import (
    IStockReservationRecorder,
)


class StockReservationRecorder(IStockReservationRecorder):
    """Increments or decrements reserved_stock without touching physical stock."""

    def __init__(self, stock_repo: IWarehouseStockRepository) -> None:
        self._stock_repo = stock_repo

    async def reserve(
        self,
        warehouse_id: int,
        product_id: int,
        quantity: int,
        user_email: str,
        reason: str,
    ) -> None:
        await self._stock_repo.adjust_reserved_stock(warehouse_id, product_id, quantity)

    async def release(
        self,
        warehouse_id: int,
        product_id: int,
        quantity: int,
        user_email: str,
        reason: str,
    ) -> None:
        await self._stock_repo.adjust_reserved_stock(
            warehouse_id, product_id, -quantity
        )
