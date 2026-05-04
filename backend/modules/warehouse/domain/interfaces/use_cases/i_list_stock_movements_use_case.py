from abc import ABC, abstractmethod
from datetime import datetime

from modules.warehouse.domain.dtos.stock_movement_item import StockMovementItem
from shared.domain.dtos.paginated_result import PaginatedResult


class IListStockMovementsUseCase(ABC):
    """Contract for listing stock movements with filters and pagination."""

    @abstractmethod
    async def execute(
        self,
        page: int,
        page_size: int,
        product_id: int | None,
        movement_type: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
        reason_search: str | None,
    ) -> PaginatedResult[StockMovementItem]: ...
