from abc import ABC, abstractmethod

from shared.domain.dtos.paginated_result import PaginatedResult
from shared.domain.entities.user import User


class IUserRepository(ABC):
    @abstractmethod
    async def get_all_paginated(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        role: str | None = None,
        active: bool | None = None,
    ) -> PaginatedResult[User]: ...

    @abstractmethod
    async def get_by_id(self, user_id: int) -> User | None: ...

    @abstractmethod
    async def get_by_email(self, email: str) -> User | None: ...

    @abstractmethod
    async def create(
        self,
        first_name: str,
        last_name: str,
        email: str,
        role: str,
        department_id: int | None,
    ) -> User: ...

    @abstractmethod
    async def update(
        self,
        user_id: int,
        first_name: str | None,
        last_name: str | None,
        role: str | None,
        department_id: int | None,
    ) -> User: ...

    @abstractmethod
    async def delete(self, user_id: int) -> None: ...

    @abstractmethod
    async def deactivate(self, user_id: int) -> None: ...

    @abstractmethod
    async def activate(
        self,
        user_id: int,
        first_name: str,
        last_name: str,
        email: str,
    ) -> None: ...
