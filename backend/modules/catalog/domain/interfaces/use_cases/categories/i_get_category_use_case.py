from abc import ABC, abstractmethod

from modules.catalog.domain.entities.category import Category


class IGetCategoryUseCase(ABC):
    @abstractmethod
    async def execute(self, category_id: int) -> Category: ...
