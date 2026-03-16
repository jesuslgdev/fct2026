from abc import ABC, abstractmethod

from modules.warehouse.domain.product_stock_overview import (
    WarehouseStockDetail,
)


class IWarehouseStockRepository(ABC):
    """Contract for warehouse stock data access."""

    @abstractmethod
    async def get_stock_by_product(self, product_id: int) -> list[WarehouseStockDetail]:
        """Fetch stock details per warehouse for a given product.

        Each entry includes the warehouse name resolved via JOIN.
        """
        ...

    @abstractmethod
    async def get_global_stock(self, product_id: int) -> int:
        """Return the total stock for a product across all warehouses."""
        ...
