from abc import ABC, abstractmethod

from modules.clients.domain.entities.client import Client


class IGetClientUseCase(ABC):
    @abstractmethod
    async def execute(self, client_id: int) -> Client | None: ...
