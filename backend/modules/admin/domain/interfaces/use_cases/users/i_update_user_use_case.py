from abc import ABC, abstractmethod

from shared.domain.entities.user import User


class IUpdateUserUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        user_id: int,
        first_name: str | None,
        last_name: str | None,
        role: str | None,
        department_id: int | None,
    ) -> User: ...
