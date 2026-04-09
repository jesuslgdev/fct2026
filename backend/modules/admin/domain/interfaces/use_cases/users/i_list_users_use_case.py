from abc import ABC, abstractmethod

from shared.domain.dtos.paginated_result import PaginatedResult
from shared.domain.entities.user import User


class IListUsersUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        role: str | None = None,
        active: bool | None = None,
    ) -> PaginatedResult[User]: ...
