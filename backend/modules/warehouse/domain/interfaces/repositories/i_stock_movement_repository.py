from abc import ABC, abstractmethod

from modules.warehouse.domain.entities.stock_movement import StockMovement


class IStockMovementRepository(ABC):
    """Contract for stock movement data access."""

    @abstractmethod
    async def create(self, movement: StockMovement) -> StockMovement:
        """Persist a new stock movement record."""
        ...

    @abstractmethod
    async def list_by_filters(
        self,
        *,
        warehouse_id: int | None = None,
        product_id: int | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[StockMovement], int]:
        """Return movements matching optional filters with pagination.

        Filtering is server-side: applies optional WHERE clauses for
        warehouse_id and/or product_id before pagination.

        Returns:
            A tuple of (items, total_count) where total_count reflects
            the filtered result set.
        """
        ...
