from abc import ABC, abstractmethod

from modules.clients.domain.entities.client import Client
from shared.domain.dtos.paginated_result import PaginatedResult


class IListClientsUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        active: bool | None = None,
    ) -> PaginatedResult[Client]: ...
