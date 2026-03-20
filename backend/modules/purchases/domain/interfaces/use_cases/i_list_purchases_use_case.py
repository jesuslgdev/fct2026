from abc import ABC, abstractmethod
from datetime import datetime

from shared.domain.paginated_result import PaginatedResult


class IListPurchasesUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        page: int,
        page_size: int,
        sort_field: str,
        sort_order: str,
        status: str | None,
        supplier_id: int | None,
        date_from: datetime | None,
        date_to: datetime | None,
        search: str | None = None,
    ) -> PaginatedResult: ...
