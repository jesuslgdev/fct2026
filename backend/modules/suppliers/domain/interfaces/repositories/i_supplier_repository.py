from abc import ABC, abstractmethod

from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.entities.supplier_product import SupplierProduct
from shared.domain.paginated_result import PaginatedResult


class ISupplierRepository(ABC):
    @abstractmethod
    async def get_all_paginated(
        self, page: int, page_size: int
    ) -> PaginatedResult[Supplier]: ...

    @abstractmethod
    async def get_by_id(self, supplier_id: int) -> Supplier | None: ...

    @abstractmethod
    async def get_by_tax_id(self, tax_id: str) -> Supplier | None: ...

    @abstractmethod
    async def update(
        self,
        supplier_id: int,
        name: str | None,
        address: str | None,
        city: str | None,
        province: str | None,
        postal_code: str | None,
        phone: str | None,
        email: str | None,
    ) -> Supplier: ...

    @abstractmethod
    async def set_active(self, supplier_id: int, is_active: bool) -> None: ...

    @abstractmethod
    async def get_products_by_supplier(
        self, supplier_id: int
    ) -> list[SupplierProduct]: ...

    @abstractmethod
    async def get_existing_tax_ids(self, tax_ids: list[str]) -> set[str]: ...

    @abstractmethod
    async def bulk_create(self, suppliers: list[Supplier]) -> int: ...
