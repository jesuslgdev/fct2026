from abc import ABC, abstractmethod


class ISetClientActiveUseCase(ABC):
    @abstractmethod
    async def execute(self, client_id: int, is_active: bool) -> None: ...
