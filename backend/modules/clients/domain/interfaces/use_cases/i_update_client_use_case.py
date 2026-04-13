from abc import ABC, abstractmethod

from modules.clients.domain.entities.client import Client
from shared.domain.dtos.address import Address


class IUpdateClientUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        client_id: int,
        name: str | None,
        address_data: Address | None,
        phone: str | None,
        email: str | None,
    ) -> Client: ...
