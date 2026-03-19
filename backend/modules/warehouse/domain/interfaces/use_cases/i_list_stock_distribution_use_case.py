from abc import ABC, abstractmethod

from modules.warehouse.domain.stock_distribution import StockDistributionPage


class IListStockDistributionUseCase(ABC):
    """Contract for listing paginated stock distribution."""

    @abstractmethod
    async def execute(
        self,
        *,
        warehouse_id: int | None = None,
        product_id: int | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> StockDistributionPage: ...
