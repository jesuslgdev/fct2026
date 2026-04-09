from abc import ABC, abstractmethod


class IActivateUserUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        user_id: int,
        first_name: str,
        last_name: str,
        email: str,
    ) -> None: ...
