from abc import ABC, abstractmethod

from modules.warehouse.domain.entities.warehouse import Warehouse
from shared.domain.dtos.address import Address


class ICreateWarehouseUseCase(ABC):
    """Contract for creating a warehouse."""

    @abstractmethod
    async def execute(self, name: str, address_data: Address) -> Warehouse: ...
