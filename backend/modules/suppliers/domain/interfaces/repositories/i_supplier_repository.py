from abc import ABC, abstractmethod
from decimal import Decimal

from modules.suppliers.domain.dtos.product_supplier_detail import (
    ProductSupplierDetail,
)
from modules.suppliers.domain.dtos.supplier_product_detail import (
    SupplierProductDetail,
)
from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.entities.supplier_product import SupplierProduct
from shared.domain.dtos.address import Address
from shared.domain.dtos.paginated_result import PaginatedResult


class ISupplierRepository(ABC):
    @abstractmethod
    async def get_all_paginated(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        active: bool | None = None,
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
        address_data: Address | None,
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
    async def create(
        self,
        name: str,
        tax_id: str,
        address_data: Address,
        phone: str,
        email: str,
    ) -> Supplier: ...

    @abstractmethod
    async def bulk_create(self, suppliers: list[Supplier]) -> int: ...

    @abstractmethod
    async def add_product(
        self, supplier_id: int, product_id: int, price: Decimal
    ) -> SupplierProduct: ...

    @abstractmethod
    async def update_product_price(
        self, supplier_id: int, product_id: int, price: Decimal
    ) -> SupplierProduct: ...

    @abstractmethod
    async def remove_product(self, supplier_id: int, product_id: int) -> None: ...

    @abstractmethod
    async def get_association(
        self, supplier_id: int, product_id: int
    ) -> SupplierProduct | None: ...

    @abstractmethod
    async def get_suppliers_by_product(
        self, product_id: int
    ) -> list[SupplierProduct]: ...

    @abstractmethod
    async def get_products_by_supplier_detailed(
        self, supplier_id: int
    ) -> list[SupplierProductDetail]: ...

    @abstractmethod
    async def get_products_by_supplier_paginated(
        self, supplier_id: int, page: int, page_size: int
    ) -> PaginatedResult[SupplierProductDetail]: ...

    @abstractmethod
    async def get_suppliers_by_product_paginated(
        self, product_id: int, page: int, page_size: int
    ) -> PaginatedResult[ProductSupplierDetail]: ...

    @abstractmethod
    async def bulk_create_products(
        self, associations: list[SupplierProduct]
    ) -> int: ...
