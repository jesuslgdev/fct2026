from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from modules.suppliers.domain.entities.supplier import Supplier
    from modules.suppliers.domain.entities.supplier_product import SupplierProduct


class ISupplierReader(ABC):
    @abstractmethod
    async def get_by_id(self, supplier_id: int) -> Supplier | None: ...

    @abstractmethod
    async def is_active(self, supplier_id: int) -> bool: ...

    @abstractmethod
    async def get_association(
        self, supplier_id: int, product_id: int
    ) -> SupplierProduct | None: ...

    @abstractmethod
    async def get_name_by_id(self, supplier_id: int) -> str | None: ...
