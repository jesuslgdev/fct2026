from abc import ABC, abstractmethod

from modules.warehouse.domain.entities.warehouse import Warehouse
from shared.domain.dtos.address import Address


class IUpdateWarehouseUseCase(ABC):
    """Contract for updating a warehouse."""

    @abstractmethod
    async def execute(
        self, warehouse_id: int, name: str, address_data: Address
    ) -> Warehouse: ...
