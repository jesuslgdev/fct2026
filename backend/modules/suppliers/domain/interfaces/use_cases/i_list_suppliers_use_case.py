from abc import ABC, abstractmethod

from modules.suppliers.domain.entities.supplier import Supplier
from shared.domain.paginated_result import PaginatedResult


class IListSuppliersUseCase(ABC):
    @abstractmethod
    async def execute(self, page: int, page_size: int) -> PaginatedResult[Supplier]: ...
