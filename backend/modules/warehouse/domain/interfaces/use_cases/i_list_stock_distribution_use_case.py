from abc import ABC, abstractmethod

from modules.warehouse.domain.stock_distribution import StockDistributionItem
from shared.domain.paginated_result import PaginatedResult


class IListStockDistributionUseCase(ABC):
    """Contract for listing paginated stock distribution."""

    @abstractmethod
    async def execute(
        self,
        page: int,
        page_size: int,
        warehouse_id: int | None = None,
        product_id: int | None = None,
    ) -> PaginatedResult[StockDistributionItem]: ...
