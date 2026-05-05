from abc import ABC, abstractmethod

from modules.warehouse.domain.dtos.stock_movement_detail import StockMovementDetail


class IGetStockMovementUseCase(ABC):
    """Contract for retrieving a single stock movement by ID."""

    @abstractmethod
    async def execute(self, movement_id: int) -> StockMovementDetail: ...
