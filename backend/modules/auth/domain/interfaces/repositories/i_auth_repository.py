from abc import ABC, abstractmethod

from shared.domain.entities.user import User


class IAuthRepository(ABC):
    @abstractmethod
    async def find_user_by_email(self, email: str) -> User | None: ...

    @abstractmethod
    async def activate_user(self, user_id: int) -> None: ...

    @abstractmethod
    async def update_last_login(self, user_id: int) -> None: ...
