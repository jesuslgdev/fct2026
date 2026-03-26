from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.entities.product import Product
from modules.suppliers.domain.entities.product_supplier_detail import (
    ProductSupplierDetail,
)
from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.entities.supplier_product import SupplierProduct
from modules.suppliers.domain.entities.supplier_product_detail import (
    SupplierProductDetail,
)
from modules.suppliers.domain.exceptions import SupplierException, SupplierExceptionInfo
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from shared.domain.interfaces.i_supplier_reader import ISupplierReader
from shared.domain.paginated_result import PaginatedResult


class SupplierRepository(ISupplierRepository, ISupplierReader):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all_paginated(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        active: bool | None = None,
    ) -> PaginatedResult[Supplier]:
        base_query = select(Supplier)
        count_query = select(func.count()).select_from(Supplier)

        if search:
            pattern = f"%{search}%"
            search_filter = (
                Supplier.name.ilike(pattern)
                | Supplier.tax_id.ilike(pattern)
                | Supplier.email.ilike(pattern)
            )
            base_query = base_query.where(search_filter)
            count_query = count_query.where(search_filter)

        if active is not None:
            base_query = base_query.where(Supplier.is_active == active)
            count_query = count_query.where(Supplier.is_active == active)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        result = await self._db.execute(
            base_query.order_by(Supplier.name, Supplier.supplier_id)
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

    # --- ISupplierReader methods ---

    async def is_active(self, supplier_id: int) -> bool:
        supplier = await self.get_by_id(supplier_id)
        return supplier is not None and supplier.is_active

    async def add_product(
        self, supplier_id: int, product_id: int, price: Decimal
    ) -> SupplierProduct:
        association = SupplierProduct(
            supplier_id=supplier_id, product_id=product_id, supplier_price=price
        )
        self._db.add(association)
        await self._db.flush()
        return association

    async def update_product_price(
        self, supplier_id: int, product_id: int, price: Decimal
    ) -> SupplierProduct:
        association = await self.get_association(supplier_id, product_id)
        if association is None:
            raise SupplierException(SupplierExceptionInfo.ASSOCIATION_NOT_FOUND)
        association.supplier_price = price
        await self._db.flush()
        await self._db.refresh(association)
        return association

    async def remove_product(self, supplier_id: int, product_id: int) -> None:
        association = await self.get_association(supplier_id, product_id)
        if association is None:
            raise SupplierException(SupplierExceptionInfo.ASSOCIATION_NOT_FOUND)
        await self._db.delete(association)
        await self._db.flush()

    async def get_association(
        self, supplier_id: int, product_id: int
    ) -> SupplierProduct | None:
        result = await self._db.execute(
            select(SupplierProduct).where(
                SupplierProduct.supplier_id == supplier_id,
                SupplierProduct.product_id == product_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_suppliers_by_product(self, product_id: int) -> list[SupplierProduct]:
        result = await self._db.execute(
            select(SupplierProduct).where(SupplierProduct.product_id == product_id)
        )
        return list(result.scalars().all())

    async def get_products_by_supplier_detailed(
        self, supplier_id: int
    ) -> list[SupplierProductDetail]:
        result = await self._db.execute(
            select(
                Product.product_id,
                Product.name.label("product_name"),
                Product.product_code,
                Category.name.label("category_name"),
                SupplierProduct.supplier_price,
            )
            .select_from(SupplierProduct)
            .join(Product, SupplierProduct.product_id == Product.product_id)
            .outerjoin(Category, Product.category_id == Category.category_id)
            .where(SupplierProduct.supplier_id == supplier_id)
            .order_by(Product.name)
        )
        return [
            SupplierProductDetail(
                product_id=row.product_id,
                product_name=row.product_name,
                product_code=row.product_code,
                category_name=row.category_name,
                supplier_price=row.supplier_price,
            )
            for row in result.all()
        ]

    async def get_products_by_supplier_paginated(
        self, supplier_id: int, page: int, page_size: int
    ) -> PaginatedResult[SupplierProductDetail]:
        total_result = await self._db.execute(
            select(func.count())
            .select_from(SupplierProduct)
            .where(SupplierProduct.supplier_id == supplier_id)
        )
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        result = await self._db.execute(
            select(
                Product.product_id,
                Product.name.label("product_name"),
                Product.product_code,
                Category.name.label("category_name"),
                SupplierProduct.supplier_price,
            )
            .select_from(SupplierProduct)
            .join(Product, SupplierProduct.product_id == Product.product_id)
            .outerjoin(Category, Product.category_id == Category.category_id)
            .where(SupplierProduct.supplier_id == supplier_id)
            .order_by(Product.name)
            .limit(page_size)
            .offset(offset)
        )
        rows = result.all()
        items = [
            SupplierProductDetail(
                product_id=row.product_id,
                product_name=row.product_name,
                product_code=row.product_code,
                category_name=row.category_name,
                supplier_price=row.supplier_price,
            )
            for row in rows
        ]

        return PaginatedResult(items=items, total=total, page=page, page_size=page_size)

    async def get_suppliers_by_product_paginated(
        self, product_id: int, page: int, page_size: int
    ) -> PaginatedResult[ProductSupplierDetail]:
        total_result = await self._db.execute(
            select(func.count())
            .select_from(SupplierProduct)
            .where(SupplierProduct.product_id == product_id)
        )
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        result = await self._db.execute(
            select(
                Supplier.supplier_id,
                Supplier.name.label("supplier_name"),
                Supplier.tax_id,
                SupplierProduct.supplier_price,
            )
            .select_from(SupplierProduct)
            .join(Supplier, SupplierProduct.supplier_id == Supplier.supplier_id)
            .where(SupplierProduct.product_id == product_id)
            .order_by(Supplier.name)
            .limit(page_size)
            .offset(offset)
        )
        rows = result.all()
        items = [
            ProductSupplierDetail(
                supplier_id=row.supplier_id,
                supplier_name=row.supplier_name,
                tax_id=row.tax_id,
                supplier_price=row.supplier_price,
            )
            for row in rows
        ]

        return PaginatedResult(items=items, total=total, page=page, page_size=page_size)

    async def bulk_create_products(self, associations: list[SupplierProduct]) -> int:
        self._db.add_all(associations)
        await self._db.flush()
        return len(associations)
