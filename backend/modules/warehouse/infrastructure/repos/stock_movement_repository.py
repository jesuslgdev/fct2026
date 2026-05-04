from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.product import Product
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

    async def get_by_id(self, movement_id: int) -> tuple[StockMovement, str] | None:
        """Return a single movement with its product name, or None if not found."""
        stmt = (
            select(StockMovement, Product.name.label("product_name"))
            .join(Product, StockMovement.product_id == Product.product_id)
            .where(StockMovement.movement_id == movement_id)
        )
        result = await self._db.execute(stmt)
        row = result.first()
        if row is None:
            return None
        return row.StockMovement, row.product_name

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
        """Return movements matching optional filters with pagination."""
        conditions = []
        if warehouse_id is not None:
            conditions.append(StockMovement.warehouse_id == warehouse_id)
        if product_id is not None:
            conditions.append(StockMovement.product_id == product_id)
        if movement_type is not None:
            conditions.append(StockMovement.movement_type == movement_type)
        if date_from is not None:
            conditions.append(StockMovement.created_at >= date_from)
        if date_to is not None:
            conditions.append(StockMovement.created_at <= date_to)
        if reason_search is not None:
            conditions.append(StockMovement.reason.ilike(f"%{reason_search}%"))

        count_query = select(func.count()).select_from(StockMovement)
        if conditions:
            count_query = count_query.where(*conditions)
        total_result = await self._db.execute(count_query)
        total_count = total_result.scalar_one()

        query = select(StockMovement, Product.name.label("product_name")).join(
            Product, StockMovement.product_id == Product.product_id
        )
        if conditions:
            query = query.where(*conditions)

        offset = (page - 1) * page_size
        query = (
            query.order_by(StockMovement.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )

        result = await self._db.execute(query)
        rows = result.all()
        return [(row.StockMovement, row.product_name) for row in rows], total_count
