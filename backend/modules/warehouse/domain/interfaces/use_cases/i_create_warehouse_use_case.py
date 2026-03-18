from abc import ABC, abstractmethod

from modules.warehouse.domain.entities.warehouse import Warehouse


class ICreateWarehouseUseCase(ABC):
    """Contract for creating a warehouse."""

    @abstractmethod
    async def execute(self, name: str, address: str) -> Warehouse: ...
