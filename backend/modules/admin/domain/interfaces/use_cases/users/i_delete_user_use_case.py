from abc import ABC, abstractmethod


class IDeleteUserUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int) -> None: ...
