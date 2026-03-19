from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.exceptions import CatalogException, CatalogExceptionInfo
from modules.catalog.domain.interfaces.repositories.i_category_repository import (
    ICategoryRepository,
)


class CategoryRepository(ICategoryRepository):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all(self) -> list[Category]:
        result = await self._db.execute(select(Category).order_by(Category.name))
        return list(result.scalars().all())

    async def get_by_id(self, category_id: int) -> Category | None:
        result = await self._db.execute(
            select(Category).where(Category.category_id == category_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Category | None:
        result = await self._db.execute(select(Category).where(Category.name == name))
        return result.scalar_one_or_none()

    async def create(self, name: str, description: str) -> Category:
        try:
            category = Category(name=name, description=description)
            self._db.add(category)
            await self._db.flush()
            await self._db.refresh(category)
            return category
        except IntegrityError:
            raise CatalogException(CatalogExceptionInfo.CATEGORY_ALREADY_EXISTS)

    async def update(
        self,
        category_id: int,
        name: str | None,
        description: str | None,
    ) -> Category:
        category = await self.get_by_id(category_id)
        if category is None:
            raise CatalogException(CatalogExceptionInfo.CATEGORY_NOT_FOUND)
        try:
            if name is not None:
                category.name = name
            if description is not None:
                category.description = description
            await self._db.flush()
            await self._db.refresh(category)
            return category
        except IntegrityError:
            raise CatalogException(CatalogExceptionInfo.CATEGORY_ALREADY_EXISTS)

    async def delete(self, category_id: int) -> None:
        category = await self.get_by_id(category_id)
        if category is not None:
            await self._db.delete(category)
            await self._db.flush()

    async def has_products(self, category_id: int) -> bool:
        # TODO: replace with Product query once entity exists
        return False
