from abc import ABC, abstractmethod

from modules.catalog.domain.entities.category import Category


class ICreateCategoryUseCase(ABC):
    """Contract for the create-category use case."""

    @abstractmethod
    async def execute(self, name: str, description: str) -> Category:
        """Create and return a new category.

        Args:
            name: Unique category name.
            description: Category description.

        Returns:
            The newly created Category entity.

        Raises:
            CatalogException: With CATEGORY_ALREADY_EXISTS if name is taken.
        """
        ...
