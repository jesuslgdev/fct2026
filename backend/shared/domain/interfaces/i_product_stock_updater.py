from abc import ABC, abstractmethod


class IProductStockUpdater(ABC):
    """Cross-module contract for updating product stock.

    Implemented by the catalog module, consumed by any module
    that needs to modify product stock without importing catalog directly.
    """

    @abstractmethod
    async def update_stock_current(self, product_id: int, new_stock: int) -> None:
        """Set the global stock_current value for a product."""
        ...
