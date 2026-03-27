from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from modules.warehouse.domain.entities.warehouse import Warehouse


class IWarehouseReader(ABC):
    """Read-only interface for cross-module access to warehouse data.

    Implement this interface in ``WarehouseRepository`` so that other modules
    can resolve warehouse names without importing warehouse internals directly.
    """

    @abstractmethod
    async def get_by_id(self, warehouse_id: int) -> Warehouse | None:
        """Return the warehouse with the given identifier, or ``None``.

        Args:
            warehouse_id: Primary key of the warehouse to retrieve.

        Returns:
            The matching ``Warehouse`` entity, or ``None`` if not found.
        """
        ...

    @abstractmethod
    async def get_name_by_id(self, warehouse_id: int) -> str | None:
        """Return the name of the warehouse with the given identifier.

        Args:
            warehouse_id: Primary key of the warehouse.

        Returns:
            The warehouse's name, or ``None`` if the warehouse does not exist.
        """
        ...
