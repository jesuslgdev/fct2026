from abc import ABC, abstractmethod


class IDeactivateUserUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int) -> None: ...
