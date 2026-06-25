from abc import ABC, abstractmethod

from modules.clients.domain.entities.client import Client
from shared.domain.dtos.address import Address


class ICreateClientUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        name: str,
        tax_id: str,
        address_data: Address,
        phone: str,
        email: str,
    ) -> Client: ...
