from abc import ABC, abstractmethod

from shared.domain.entities.user import User


class IAuthRepository(ABC):
    @abstractmethod
    async def find_active_user_by_email(self, email: str) -> User | None: ...
