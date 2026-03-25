from abc import ABC, abstractmethod

from modules.warehouse.domain.dtos.product_stock_overview import (
    WarehouseStockDetail,
)
from modules.warehouse.domain.dtos.stock_distribution import StockDistributionItem
from modules.warehouse.domain.entities.warehouse_stock import WarehouseStock
from shared.domain.paginated_result import PaginatedResult


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

    @abstractmethod
    async def get_by_warehouse_and_product(
        self, warehouse_id: int, product_id: int
    ) -> WarehouseStock | None:
        """Return the stock record for a specific warehouse-product pair."""
        ...

    @abstractmethod
    async def upsert_stock(
        self, warehouse_id: int, product_id: int, new_stock: int
    ) -> WarehouseStock:
        """Create or update the stock for a warehouse-product pair."""
        ...

    @abstractmethod
    async def list_distribution(
        self,
        page: int,
        page_size: int,
        warehouse_id: int | None = None,
        product_id: int | None = None,
    ) -> PaginatedResult[StockDistributionItem]:
        """Return paginated stock distribution across warehouses and products."""
        ...
