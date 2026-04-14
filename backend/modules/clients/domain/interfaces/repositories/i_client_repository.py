from abc import ABC, abstractmethod

from modules.clients.domain.entities.client import Client
from shared.domain.dtos.address import Address
from shared.domain.dtos.paginated_result import PaginatedResult


class IClientRepository(ABC):
    @abstractmethod
    async def get_all_paginated(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        active: bool | None = None,
    ) -> PaginatedResult[Client]: ...

    @abstractmethod
    async def get_by_id(self, client_id: int) -> Client | None: ...

    @abstractmethod
    async def get_by_tax_id(self, tax_id: str) -> Client | None: ...

    @abstractmethod
    async def get_by_email(self, email: str) -> Client | None: ...

    @abstractmethod
    async def create(
        self,
        name: str,
        tax_id: str,
        address_data: Address,
        phone: str,
        email: str,
    ) -> Client: ...

    @abstractmethod
    async def update(
        self,
        client_id: int,
        name: str | None,
        address_data: Address | None,
        phone: str | None,
        email: str | None,
    ) -> Client: ...

    @abstractmethod
    async def set_active(self, client_id: int, is_active: bool) -> None: ...
