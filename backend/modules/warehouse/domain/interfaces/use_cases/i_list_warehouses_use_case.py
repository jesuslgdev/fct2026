from abc import ABC, abstractmethod

from modules.warehouse.domain.dtos.warehouse_detail import WarehouseDetail


class IListWarehousesUseCase(ABC):
    """Contract for listing all warehouses with total stock."""

    @abstractmethod
    async def execute(self) -> list[WarehouseDetail]: ...
