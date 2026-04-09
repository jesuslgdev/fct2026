from abc import ABC, abstractmethod

from modules.catalog.domain.entities.product import Product
from shared.domain.dtos.paginated_result import PaginatedResult


class IListProductsUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        page: int,
        page_size: int,
        category_id: int | None = None,
        search: str | None = None,
        active: bool | None = None,
        sort_field: str = "name",
        sort_order: str = "asc",
    ) -> PaginatedResult[Product]:
        """Fetch a paginated list of products."""
        ...
