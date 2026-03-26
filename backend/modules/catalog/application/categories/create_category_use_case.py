from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.interfaces.repositories.i_category_repository import (
    ICategoryRepository,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_create_category_use_case import (
    ICreateCategoryUseCase,
)


class CreateCategoryUseCase(ICreateCategoryUseCase):
    def __init__(self, repo: ICategoryRepository) -> None:
        self._repo = repo

    async def execute(self, name: str, description: str) -> Category:
        return await self._repo.create(name, description)
