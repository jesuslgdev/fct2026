from abc import ABC, abstractmethod

from modules.catalog.domain.entities.category import Category


class IUpdateCategoryUseCase(ABC):
    """Contract for the update-category use case."""

    @abstractmethod
    async def execute(
        self,
        category_id: int,
        name: str | None,
        description: str | None,
    ) -> Category:
        """Apply a partial update to an existing category.

        Args:
            category_id: Primary key of the category to update.
            name: New name, or None to leave unchanged.
            description: New description, or None to leave unchanged.

        Returns:
            The updated Category entity.

        Raises:
            CatalogException: With CATEGORY_NOT_FOUND if id does not exist.
            CatalogException: With CATEGORY_ALREADY_EXISTS if new name is taken.
        """
        ...
