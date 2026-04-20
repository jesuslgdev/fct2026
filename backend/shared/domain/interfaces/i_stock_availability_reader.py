from abc import ABC, abstractmethod


class IStockAvailabilityReader(ABC):
    """Read-only interface for querying available stock in a warehouse.

    Implement this in ``WarehouseStockRepository`` so that other modules
    can check per-warehouse availability without importing warehouse internals.
    """

    @abstractmethod
    async def get_available_stock(self, warehouse_id: int, product_id: int) -> int:
        """Return the available (unreserved) stock for a product in a warehouse.

        Available stock = physical stock minus reserved stock.
        Returns 0 if no stock record exists for the given pair.

        Args:
            warehouse_id: Primary key of the warehouse.
            product_id: Primary key of the product.

        Returns:
            Non-negative integer representing available units.
        """
        ...
