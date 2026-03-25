from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.product import Product
from modules.warehouse.domain.dtos.product_stock_overview import WarehouseStockDetail
from modules.warehouse.domain.dtos.stock_distribution import StockDistributionItem
from modules.warehouse.domain.entities.warehouse import Warehouse
from modules.warehouse.domain.entities.warehouse_stock import WarehouseStock
from modules.warehouse.domain.interfaces.repositories.i_warehouse_stock_repository import (
    IWarehouseStockRepository,
)
from shared.domain.paginated_result import PaginatedResult


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

    async def get_by_warehouse_and_product(
        self, warehouse_id: int, product_id: int
    ) -> WarehouseStock | None:
        """Return the stock record for a specific warehouse-product pair."""
        result = await self._db.execute(
            select(WarehouseStock).where(
                WarehouseStock.warehouse_id == warehouse_id,
                WarehouseStock.product_id == product_id,
            )
        )
        return result.scalar_one_or_none()

    async def upsert_stock(
        self, warehouse_id: int, product_id: int, new_stock: int
    ) -> WarehouseStock:
        """Create or update the stock for a warehouse-product pair."""
        existing = await self.get_by_warehouse_and_product(warehouse_id, product_id)
        if existing is not None:
            existing.stock = new_stock
            await self._db.flush()
            return existing

        record = WarehouseStock(
            warehouse_id=warehouse_id,
            product_id=product_id,
            stock=new_stock,
            reserved_stock=0,
        )
        self._db.add(record)
        await self._db.flush()
        await self._db.refresh(record)
        return record

    async def list_distribution(
        self,
        page: int,
        page_size: int,
        warehouse_id: int | None = None,
        product_id: int | None = None,
    ) -> PaginatedResult[StockDistributionItem]:
        """Return paginated stock distribution with server-side filtering."""
        query = (
            select(
                WarehouseStock,
                Warehouse.name.label("warehouse_name"),
                Product.product_code,
                Product.name.label("product_name"),
            )
            .join(Warehouse, WarehouseStock.warehouse_id == Warehouse.warehouse_id)
            .join(Product, WarehouseStock.product_id == Product.product_id)
        )

        if warehouse_id is not None:
            query = query.where(WarehouseStock.warehouse_id == warehouse_id)

        if product_id is not None:
            query = query.where(WarehouseStock.product_id == product_id)

        count_query = select(func.count()).select_from(query.subquery())
        total = (await self._db.execute(count_query)).scalar_one()

        offset = (page - 1) * page_size
        query = (
            query.order_by(Warehouse.name, Product.name).offset(offset).limit(page_size)
        )

        result = await self._db.execute(query)
        items = [
            StockDistributionItem(
                warehouse_id=row.WarehouseStock.warehouse_id,
                warehouse_name=row.warehouse_name,
                product_id=row.WarehouseStock.product_id,
                product_code=row.product_code,
                product_name=row.product_name,
                stock=row.WarehouseStock.stock,
                reserved_stock=row.WarehouseStock.reserved_stock,
                available_stock=row.WarehouseStock.available_stock,
            )
            for row in result.all()
        ]

        return PaginatedResult(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
        )
