from abc import ABC, abstractmethod


class IDeleteWarehouseUseCase(ABC):
    """Contract for deleting a warehouse."""

    @abstractmethod
    async def execute(self, warehouse_id: int) -> None: ...
