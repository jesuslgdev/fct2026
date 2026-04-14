from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.exceptions import CatalogException, CatalogExceptionInfo
from modules.catalog.domain.interfaces.repositories.i_category_repository import (
    ICategoryRepository,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_get_category_use_case import (
    IGetCategoryUseCase,
)


class GetCategoryUseCase(IGetCategoryUseCase):
    def __init__(self, repo: ICategoryRepository) -> None:
        self._repo = repo

    async def execute(self, category_id: int) -> Category:
        category = await self._repo.get_by_id(category_id)
        if category is None:
            raise CatalogException(CatalogExceptionInfo.CATEGORY_NOT_FOUND)
        return category
