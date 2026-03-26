from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from modules.clients.domain.entities.client import Client


class IClientReader(ABC):
    @abstractmethod
    async def get_by_id(self, client_id: int) -> Client | None: ...

    @abstractmethod
    async def get_name_by_id(self, client_id: int) -> str: ...
