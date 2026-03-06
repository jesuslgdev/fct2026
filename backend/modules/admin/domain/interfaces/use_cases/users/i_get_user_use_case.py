from abc import ABC, abstractmethod

from shared.domain.entities.user import User


class IGetUserUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int) -> User | None: ...
