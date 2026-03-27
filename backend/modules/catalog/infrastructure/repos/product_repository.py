from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from modules.catalog.domain.entities.product import Product
from modules.catalog.domain.exceptions import CatalogException, CatalogExceptionInfo
from modules.catalog.domain.interfaces.repositories.i_product_repository import (
    IProductRepository,
)
from shared.domain.dtos.paginated_result import PaginatedResult
from shared.domain.interfaces.i_product_reader import IProductReader

SORT_FIELDS = {
    "name": Product.name,
    "price": Product.price,
}


class ProductRepository(IProductRepository, IProductReader):
    """SQLAlchemy implementation of the Product repository."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all_paginated(
        self,
        page: int,
        page_size: int,
        category_id: int | None = None,
        search: str | None = None,
        active: bool | None = None,
        sort_field: str = "name",
        sort_order: str = "asc",
    ) -> PaginatedResult[Product]:
        base_query = select(Product).options(selectinload(Product.category))
        count_query = select(func.count()).select_from(Product)

        if category_id:
            base_query = base_query.where(Product.category_id == category_id)
            count_query = count_query.where(Product.category_id == category_id)
        if search:
            pattern = f"%{search}%"
            search_filter = Product.name.ilike(pattern) | Product.product_code.ilike(
                pattern
            )
            base_query = base_query.where(search_filter)
            count_query = count_query.where(search_filter)
        if active is not None:
            base_query = base_query.where(Product.is_active == active)
            count_query = count_query.where(Product.is_active == active)

        total = (await self._db.execute(count_query)).scalar_one()

        # Fetch page
        order_col = SORT_FIELDS.get(sort_field, Product.name)
        order_expr = order_col.desc() if sort_order == "desc" else order_col.asc()
        offset = (page - 1) * page_size
        result = await self._db.execute(
            base_query.order_by(order_expr, Product.product_id)
            .limit(page_size)
            .offset(offset)
        )
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

    async def create(
        self,
        product_code: str,
        name: str,
        description: str | None,
        category_id: int,
        price: Decimal,
        vat_rate: Decimal,
        stock_current: int,
        stock_min: int,
    ) -> Product:
        product = Product(
            product_code=product_code,
            name=name,
            description=description,
            category_id=category_id,
            price=price,
            vat_rate=vat_rate,
            stock_current=stock_current,
            stock_min=stock_min,
            is_active=True,
        )
        self._db.add(product)
        await self._db.flush()
        await self._db.refresh(product, ["category"])
        return product

    async def update(
        self,
        product_id: int,
        product_code: str | None = None,
        name: str | None = None,
        description: str | None = None,
        category_id: int | None = None,
        price: Decimal | None = None,
        vat_rate: Decimal | None = None,
        stock_min: int | None = None,
    ) -> Product:
        product = await self.get_by_id(product_id)
        if product is None:
            raise CatalogException(CatalogExceptionInfo.PRODUCT_NOT_FOUND)

        if product_code is not None:
            product.product_code = product_code
        if name is not None:
            product.name = name
        if description is not None:
            product.description = description
        if category_id is not None:
            product.category_id = category_id
        if price is not None:
            product.price = price
        if vat_rate is not None:
            product.vat_rate = vat_rate
        if stock_min is not None:
            product.stock_min = stock_min

        await self._db.flush()
        await self._db.refresh(product, ["category"])
        return product

    async def set_active(self, product_id: int, is_active: bool) -> None:
        product = await self.get_by_id(product_id)
        if product is None:
            raise CatalogException(CatalogExceptionInfo.PRODUCT_NOT_FOUND)

        product.is_active = is_active
        await self._db.flush()

    async def is_active(self, product_id: int) -> bool:
        product = await self.get_by_id(product_id)
        return product.is_active if product else False
