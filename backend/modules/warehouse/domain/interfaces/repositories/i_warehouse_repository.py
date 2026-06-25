from abc import ABC, abstractmethod

from modules.warehouse.domain.entities.warehouse import Warehouse
from shared.domain.dtos.address import Address


class IWarehouseRepository(ABC):
    """Contract for warehouse CRUD data access."""

    @abstractmethod
    async def get_all(self) -> list[Warehouse]: ...

    @abstractmethod
    async def get_by_id(self, warehouse_id: int) -> Warehouse | None: ...

    @abstractmethod
    async def get_by_name(self, name: str) -> Warehouse | None: ...

    @abstractmethod
    async def create(self, name: str, address_data: Address) -> Warehouse: ...

    @abstractmethod
    async def update(
        self, warehouse_id: int, name: str, address_data: Address
    ) -> Warehouse: ...

    @abstractmethod
    async def delete(self, warehouse_id: int) -> None: ...

    @abstractmethod
    async def get_total_stock(self, warehouse_id: int) -> int: ...

    @abstractmethod
    async def has_stock_history(self, warehouse_id: int) -> bool: ...
