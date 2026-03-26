from abc import ABC, abstractmethod

from modules.clients.domain.entities.client import Client


class IUpdateClientUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        client_id: int,
        name: str | None,
        address: str | None,
        city: str | None,
        province: str | None,
        postal_code: str | None,
        phone: str | None,
        email: str | None,
    ) -> Client: ...
