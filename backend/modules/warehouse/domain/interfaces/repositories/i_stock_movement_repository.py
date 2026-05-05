from abc import ABC, abstractmethod
from datetime import datetime

from modules.warehouse.domain.entities.stock_movement import StockMovement


class IStockMovementRepository(ABC):
    """Contract for stock movement data access."""

    @abstractmethod
    async def create(self, movement: StockMovement) -> StockMovement:
        """Persist a new stock movement record."""
        ...

    @abstractmethod
    async def get_by_id(
        self, movement_id: int
    ) -> tuple[StockMovement, str, str] | None:
        """Return a movement with its product and warehouse names, or None.

        Returns:
            A tuple of (movement, product_name, warehouse_name), or None.
        """
        ...

    @abstractmethod
    async def list_by_filters(
        self,
        *,
        warehouse_id: int | None = None,
        product_id: int | None = None,
        movement_type: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        reason_search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[tuple[StockMovement, str]], int]:
        """Return movements matching optional filters with pagination.

        Joins with the products table so each row includes the product name.

        Returns:
            A tuple of ((movement, product_name) pairs, total_count).
        """
        ...
