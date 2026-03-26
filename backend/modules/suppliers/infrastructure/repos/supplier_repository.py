from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.entities.supplier_product import SupplierProduct
from modules.suppliers.domain.exceptions import SupplierException, SupplierExceptionInfo
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from shared.domain.paginated_result import PaginatedResult


class SupplierRepository(ISupplierRepository):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all_paginated(
        self, page: int, page_size: int
    ) -> PaginatedResult[Supplier]:
        total_result = await self._db.execute(
            select(func.count()).select_from(Supplier)
        )
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        result = await self._db.execute(
            select(Supplier)
            .order_by(Supplier.name, Supplier.supplier_id)
            .limit(page_size)
            .offset(offset)
        )
        items = list(result.scalars().all())

        return PaginatedResult(items=items, total=total, page=page, page_size=page_size)

    async def get_by_id(self, supplier_id: int) -> Supplier | None:
        result = await self._db.execute(
            select(Supplier).where(Supplier.supplier_id == supplier_id)
        )
        return result.scalar_one_or_none()

    async def get_by_tax_id(self, tax_id: str) -> Supplier | None:
        result = await self._db.execute(
            select(Supplier).where(Supplier.tax_id == tax_id)
        )
        return result.scalar_one_or_none()

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
    ) -> Supplier:
        supplier = await self.get_by_id(supplier_id)
        if supplier is None:
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_NOT_FOUND)
        if name is not None:
            supplier.name = name
        if address is not None:
            supplier.address = address
        if city is not None:
            supplier.city = city
        if province is not None:
            supplier.province = province
        if postal_code is not None:
            supplier.postal_code = postal_code
        if phone is not None:
            supplier.phone = phone
        if email is not None:
            supplier.email = email
        await self._db.flush()
        await self._db.refresh(supplier)
        return supplier

    async def set_active(self, supplier_id: int, is_active: bool) -> None:
        supplier = await self.get_by_id(supplier_id)
        if supplier is None:
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_NOT_FOUND)
        supplier.is_active = is_active
        await self._db.flush()

    async def get_products_by_supplier(self, supplier_id: int) -> list[SupplierProduct]:
        result = await self._db.execute(
            select(SupplierProduct).where(SupplierProduct.supplier_id == supplier_id)
        )
        return list(result.scalars().all())

    async def get_existing_tax_ids(self, tax_ids: list[str]) -> set[str]:
        result = await self._db.execute(
            select(Supplier.tax_id).where(Supplier.tax_id.in_(tax_ids))
        )
        return set(result.scalars().all())

    async def create(
        self,
        name: str,
        tax_id: str,
        address: str,
        city: str,
        province: str,
        postal_code: str,
        phone: str,
        email: str,
    ) -> Supplier:
        supplier = Supplier(
            name=name,
            tax_id=tax_id,
            address=address,
            city=city,
            province=province,
            postal_code=postal_code,
            phone=phone,
            email=email,
        )
        self._db.add(supplier)
        await self._db.flush()
        await self._db.refresh(supplier)
        return supplier

    async def bulk_create(self, suppliers: list[Supplier]) -> int:
        self._db.add_all(suppliers)
        await self._db.flush()
        return len(suppliers)
