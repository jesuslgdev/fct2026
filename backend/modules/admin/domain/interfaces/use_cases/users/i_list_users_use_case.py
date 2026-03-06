from abc import ABC, abstractmethod

from shared.domain.entities.user import User
from shared.domain.paginated_result import PaginatedResult


class IListUsersUseCase(ABC):
    @abstractmethod
    async def execute(self, page: int, page_size: int) -> PaginatedResult[User]: ...
