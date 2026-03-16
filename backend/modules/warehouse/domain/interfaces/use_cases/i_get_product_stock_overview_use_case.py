from abc import ABC, abstractmethod

from modules.warehouse.domain.product_stock_overview import (
    ProductStockOverview,
)


class IGetProductStockOverviewUseCase(ABC):
    """Contract for retrieving the stock overview of a product."""

    @abstractmethod
    async def execute(self, product_id: int) -> ProductStockOverview:
        """Return global stock, per-warehouse breakdown, and alert level."""
        ...
