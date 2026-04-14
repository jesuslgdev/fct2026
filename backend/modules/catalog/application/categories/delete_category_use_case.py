from modules.catalog.domain.exceptions import CatalogException, CatalogExceptionInfo
from modules.catalog.domain.interfaces.repositories.i_category_repository import (
    ICategoryRepository,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_delete_category_use_case import (
    IDeleteCategoryUseCase,
)


class DeleteCategoryUseCase(IDeleteCategoryUseCase):
    def __init__(self, repo: ICategoryRepository) -> None:
        self._repo = repo

    async def execute(self, category_id: int) -> None:
        category = await self._repo.get_by_id(category_id)
        if category is None:
            raise CatalogException(CatalogExceptionInfo.CATEGORY_NOT_FOUND)
        if await self._repo.has_products(category_id):
            raise CatalogException(CatalogExceptionInfo.CATEGORY_HAS_PRODUCTS)
        await self._repo.delete(category_id)
