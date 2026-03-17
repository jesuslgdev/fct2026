from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.warehouse.domain.entities.warehouse import Warehouse
from modules.warehouse.domain.entities.warehouse_stock import WarehouseStock
from modules.warehouse.domain.interfaces.repositories.i_warehouse_stock_repository import (
    IWarehouseStockRepository,
)
from modules.warehouse.domain.product_stock_overview import WarehouseStockDetail


class WarehouseStockRepository(IWarehouseStockRepository):
    """SQLAlchemy implementation of the warehouse stock repository."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_stock_by_product(self, product_id: int) -> list[WarehouseStockDetail]:
        """Fetch per-warehouse stock for a product, including warehouse name."""
        result = await self._db.execute(
            select(WarehouseStock, Warehouse.name)
            .join(Warehouse, WarehouseStock.warehouse_id == Warehouse.warehouse_id)
            .where(WarehouseStock.product_id == product_id)
            .order_by(Warehouse.name)
        )
        return [
            WarehouseStockDetail(
                warehouse_id=row.WarehouseStock.warehouse_id,
                warehouse_name=row.name,
                stock=row.WarehouseStock.stock,
                reserved_stock=row.WarehouseStock.reserved_stock,
                available_stock=row.WarehouseStock.available_stock,
            )
            for row in result.all()
        ]

    async def get_global_stock(self, product_id: int) -> int:
        """Return the total stock for a product across all warehouses."""
        result = await self._db.execute(
            select(func.coalesce(func.sum(WarehouseStock.stock), 0)).where(
                WarehouseStock.product_id == product_id
            )
        )
        return result.scalar_one()
