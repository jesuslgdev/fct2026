from abc import ABC, abstractmethod


class IDeleteCategoryUseCase(ABC):
    """Contract for the delete-category use case."""

    @abstractmethod
    async def execute(self, category_id: int) -> None:
        """Delete a category by id.

        Args:
            category_id: Primary key of the category to delete.

        Raises:
            CatalogException: With CATEGORY_NOT_FOUND if id does not exist.
            CatalogException: With CATEGORY_HAS_PRODUCTS if the category
                still has associated products.
        """
        ...
