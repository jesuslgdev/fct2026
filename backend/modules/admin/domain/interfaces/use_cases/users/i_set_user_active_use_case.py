from abc import ABC, abstractmethod


class ISetUserActiveUseCase(ABC):
    @abstractmethod
    async def execute(self, user_id: int, is_active: bool) -> None: ...
