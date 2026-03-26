from abc import ABC, abstractmethod

from modules.clients.domain.entities.client import Client


class ICreateClientUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        name: str,
        tax_id: str,
        address: str,
        city: str,
        province: str,
        postal_code: str,
        phone: str,
        email: str,
    ) -> Client: ...
