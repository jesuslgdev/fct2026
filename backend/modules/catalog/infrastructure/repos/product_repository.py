from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from modules.catalog.domain.entities.product import Product
from modules.catalog.domain.exceptions import CatalogException, CatalogExceptionInfo
from modules.catalog.domain.interfaces.repositories.i_product_repository import (
    IProductRepository,
)
from shared.domain.paginated_result import PaginatedResult


class ProductRepository(IProductRepository):
    """SQLAlchemy implementation of the Product repository."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all_paginated(
        self, page: int, page_size: int, category_id: int | None = None
    ) -> PaginatedResult[Product]:
        query = select(Product).options(selectinload(Product.category))
        if category_id:
            query = query.where(Product.category_id == category_id)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self._db.execute(count_query)).scalar_one()

        # Fetch page
        offset = (page - 1) * page_size
        query = (
            query.order_by(Product.name, Product.product_id)
            .limit(page_size)
            .offset(offset)
        )
        result = await self._db.execute(query)
        items = list(result.scalars().all())

        return PaginatedResult(items=items, total=total, page=page, page_size=page_size)

    async def get_by_id(self, product_id: int) -> Product | None:
        query = (
            select(Product)
            .options(selectinload(Product.category))
            .where(Product.product_id == product_id)
        )
        result = await self._db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_code(self, product_code: str) -> Product | None:
        query = select(Product).where(Product.product_code == product_code)
        result = await self._db.execute(query)
        return result.scalar_one_or_none()

    async def create(self, product: Product) -> Product:
        self._db.add(product)
        await self._db.flush()
        await self._db.refresh(product, ["category"])
        return product

    async def update(
        self,
        product_id: int,
        name: str | None = None,
        description: str | None = None,
        category_id: int | None = None,
        price: Decimal | None = None,
        stock_min: int | None = None,
        product_code: str | None = None,
    ) -> Product:
        product = await self.get_by_id(product_id)
        if product is None:
            raise CatalogException(CatalogExceptionInfo.PRODUCT_NOT_FOUND)

        if name is not None:
            product.name = name
        if description is not None:
            product.description = description
        if category_id is not None:
            product.category_id = category_id
        if price is not None:
            product.price = price
        if stock_min is not None:
            product.stock_min = stock_min
        if product_code is not None:
            product.product_code = product_code

        await self._db.flush()
        await self._db.refresh(product)
        return product

    async def set_active(self, product_id: int, is_active: bool) -> None:
        product = await self.get_by_id(product_id)
        if product is None:
            raise CatalogException(CatalogExceptionInfo.PRODUCT_NOT_FOUND)

        product.is_active = is_active
        await self._db.flush()
