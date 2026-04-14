from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.interfaces.repositories.i_category_repository import (
    ICategoryRepository,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_update_category_use_case import (
    IUpdateCategoryUseCase,
)


class UpdateCategoryUseCase(IUpdateCategoryUseCase):
    def __init__(self, repo: ICategoryRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        category_id: int,
        name: str | None,
        description: str | None,
    ) -> Category:
        return await self._repo.update(category_id, name, description)
