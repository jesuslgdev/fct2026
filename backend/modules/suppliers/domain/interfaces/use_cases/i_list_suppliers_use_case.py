from abc import ABC, abstractmethod

from modules.suppliers.domain.entities.supplier import Supplier
from shared.domain.dtos.paginated_result import PaginatedResult


class IListSuppliersUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        active: bool | None = None,
    ) -> PaginatedResult[Supplier]: ...
