from abc import ABC, abstractmethod

from modules.catalog.domain.entities.category import Category


class IListCategoriesUseCase(ABC):
    """Contract for the list-all-categories use case."""

    @abstractmethod
    async def execute(self) -> list[Category]:
        """Return all categories.

        Returns:
            List of all Category entities.
        """
        ...
