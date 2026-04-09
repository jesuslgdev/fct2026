from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.warehouse.domain.entities.stock_movement import StockMovement
from modules.warehouse.domain.interfaces.repositories.i_stock_movement_repository import (
    IStockMovementRepository,
)


class StockMovementRepository(IStockMovementRepository):
    """SQLAlchemy implementation of the stock movement repository."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, movement: StockMovement) -> StockMovement:
        """Persist a new stock movement record."""
        self._db.add(movement)
        await self._db.flush()
        await self._db.refresh(movement)
        return movement

    async def list_by_filters(
        self,
        *,
        warehouse_id: int | None = None,
        product_id: int | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[StockMovement], int]:
        """Return movements matching optional filters with pagination."""
        query = select(StockMovement)
        count_query = select(func.count()).select_from(StockMovement)

        if warehouse_id is not None:
            query = query.where(StockMovement.warehouse_id == warehouse_id)
            count_query = count_query.where(StockMovement.warehouse_id == warehouse_id)

        if product_id is not None:
            query = query.where(StockMovement.product_id == product_id)
            count_query = count_query.where(StockMovement.product_id == product_id)

        total_result = await self._db.execute(count_query)
        total_count = total_result.scalar_one()

        offset = (page - 1) * page_size
        query = (
            query.order_by(StockMovement.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )

        result = await self._db.execute(query)
        items = list(result.scalars().all())

        return items, total_count
