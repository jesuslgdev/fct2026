from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.interfaces.repositories.i_category_repository import (
    ICategoryRepository,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_list_categories_use_case import (
    IListCategoriesUseCase,
)


class ListCategoriesUseCase(IListCategoriesUseCase):
    def __init__(self, repo: ICategoryRepository) -> None:
        self._repo = repo

    async def execute(self) -> list[Category]:
        return await self._repo.get_all()
