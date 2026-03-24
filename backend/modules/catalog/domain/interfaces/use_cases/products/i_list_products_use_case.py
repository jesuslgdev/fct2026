from abc import ABC, abstractmethod

from modules.catalog.domain.entities.product import Product
from shared.domain.paginated_result import PaginatedResult


class IListProductsUseCase(ABC):
    @abstractmethod
    async def execute(
        self, page: int, page_size: int, category_id: int | None = None
    ) -> PaginatedResult[Product]:
        """Fetch a paginated list of products."""
        ...
