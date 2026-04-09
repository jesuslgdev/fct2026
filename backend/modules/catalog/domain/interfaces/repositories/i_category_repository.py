from abc import ABC, abstractmethod

from modules.catalog.domain.entities.category import Category


class ICategoryRepository(ABC):
    """Abstract contract for category persistence operations."""

    @abstractmethod
    async def get_all(self) -> list[Category]:
        """Return all categories ordered by name.

        Returns:
            List of all Category entities.
        """
        ...

    @abstractmethod
    async def get_by_id(self, category_id: int) -> Category | None:
        """Return the category with the given id, or None if not found.

        Args:
            category_id: Primary key of the category.

        Returns:
            Matching Category entity, or None.
        """
        ...

    @abstractmethod
    async def get_by_name(self, name: str) -> Category | None:
        """Return the category with the given name, or None if not found.

        Args:
            name: Unique category name.

        Returns:
            Matching Category entity, or None.
        """
        ...

    @abstractmethod
    async def create(self, name: str, description: str) -> Category:
        """Persist a new category and return the created entity.

        Args:
            name: Unique category name.
            description: Category description.

        Returns:
            The newly created Category entity.

        Raises:
            CatalogException: With CATEGORY_ALREADY_EXISTS if name is taken.
        """
        ...

    @abstractmethod
    async def update(
        self,
        category_id: int,
        name: str | None,
        description: str | None,
    ) -> Category:
        """Apply a partial update to an existing category.

        Only non-None fields are written; others are left unchanged.

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

    @abstractmethod
    async def delete(self, category_id: int) -> None:
        """Delete the category with the given id.

        Args:
            category_id: Primary key of the category to delete.

        Raises:
            CatalogException: With CATEGORY_NOT_FOUND if id does not exist.
        """
        ...

    @abstractmethod
    async def has_products(self, category_id: int) -> bool:
        """Return True if the category has at least one associated product.

        Args:
            category_id: Primary key of the category to check.

        Returns:
            True if products exist for this category, False otherwise.
        """
        ...
