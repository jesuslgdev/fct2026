from abc import ABC, abstractmethod

from shared.domain.entities.user import User


class ICreateUserUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        first_name: str,
        last_name: str,
        email: str,
        role: str,
        department_id: int | None,
    ) -> User: ...
