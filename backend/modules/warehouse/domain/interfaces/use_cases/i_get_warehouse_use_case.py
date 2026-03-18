from abc import ABC, abstractmethod

from modules.warehouse.domain.warehouse_detail import WarehouseDetail


class IGetWarehouseUseCase(ABC):
    """Contract for retrieving a single warehouse with total stock."""

    @abstractmethod
    async def execute(self, warehouse_id: int) -> WarehouseDetail: ...
