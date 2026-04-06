from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from modules.purchases.domain.entities.purchase import Purchase
from modules.purchases.domain.entities.purchase_line import PurchaseLine
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.suppliers.domain.entities.supplier import Supplier
from shared.domain.dtos.paginated_result import PaginatedResult
from shared.domain.interfaces.i_purchase_reader import IPurchaseReader

SORT_FIELDS = {
    "purchase_number": Purchase.purchase_number,
    "supplier_name": Supplier.name,
    "status": Purchase.status,
    "created_at": Purchase.created_at,
    "total": Purchase.total,
}


class PurchaseRepository(IPurchaseRepository, IPurchaseReader):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all_paginated(
        self,
        page: int,
        page_size: int,
        sort_field: str,
        sort_order: str,
        status: str | None,
        supplier_id: int | None,
        date_from: datetime | None,
        date_to: datetime | None,
        search: str | None = None,
    ) -> PaginatedResult[tuple]:
        filters = []
        if search:
            pattern = f"%{search}%"
            filters.append(
                Purchase.purchase_number.ilike(pattern) | Supplier.name.ilike(pattern)
            )
        if status:
            filters.append(Purchase.status == status)
        if supplier_id:
            filters.append(Purchase.supplier_id == supplier_id)
        if date_from:
            filters.append(Purchase.created_at >= date_from)
        if date_to:
            filters.append(Purchase.created_at <= date_to)

        count_stmt = (
            select(func.count())
            .select_from(Purchase)
            .outerjoin(Supplier, Purchase.supplier_id == Supplier.supplier_id)
            .where(*filters)
        )
        total_result = await self._db.execute(count_stmt)
        total = total_result.scalar_one()

        order_col = SORT_FIELDS.get(sort_field, Purchase.created_at)
        order_expr = order_col.desc() if sort_order == "desc" else order_col.asc()
        offset = (page - 1) * page_size

        data_stmt = (
            select(Purchase, Supplier.name.label("supplier_name"))
            .outerjoin(Supplier, Purchase.supplier_id == Supplier.supplier_id)
            .where(*filters)
            .order_by(order_expr)
            .limit(page_size)
            .offset(offset)
        )

        result = await self._db.execute(data_stmt)
        items = list(result.all())

        return PaginatedResult(items=items, total=total, page=page, page_size=page_size)

    async def get_by_id(self, purchase_id: int) -> Purchase | None:
        result = await self._db.execute(
            select(Purchase).where(Purchase.purchase_id == purchase_id)
        )
        return result.scalar_one_or_none()

    async def generate_purchase_number(self) -> str:
        year = datetime.now().year
        prefix = f"COM-{year}-"
        result = await self._db.execute(
            text(
                "SELECT MAX(purchase_number) FROM purchases "
                "WHERE purchase_number LIKE :pattern"
            ),
            {"pattern": f"{prefix}%"},
        )
        max_number = result.scalar_one_or_none()
        if max_number:
            seq = int(max_number.split("-")[-1]) + 1
        else:
            seq = 1
        return f"{prefix}{seq:04d}"

    async def create(
        self,
        purchase_number: str,
        supplier_id: int,
        user_id: int,
        warehouse_id: int,
        status: str,
        subtotal: Decimal,
        taxes: Decimal,
        total: Decimal,
        lines: list[dict],
    ) -> Purchase:
        purchase = Purchase(
            purchase_number=purchase_number,
            supplier_id=supplier_id,
            user_id=user_id,
            warehouse_id=warehouse_id,
            status=status,
            subtotal=subtotal,
            taxes=taxes,
            total=total,
        )
        self._db.add(purchase)
        await self._db.flush()

        for line in lines:
            purchase_line = PurchaseLine(
                purchase_id=purchase.purchase_id,
                product_id=line["product_id"],
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                discount=line["discount"],
                line_subtotal=line["line_subtotal"],
                vat_rate=line["vat_rate"],
                line_tax=line["line_tax"],
            )
            self._db.add(purchase_line)

        await self._db.flush()
        await self._db.refresh(purchase, ["lines"])
        return purchase

    async def get_line_by_id(self, purchase_line_id: int) -> PurchaseLine | None:
        result = await self._db.execute(
            select(PurchaseLine).where(
                PurchaseLine.purchase_line_id == purchase_line_id
            )
        )
        return result.scalar_one_or_none()

    async def add_line(
        self,
        purchase_id: int,
        product_id: int,
        quantity: int,
        unit_price: Decimal,
        discount: Decimal,
        line_subtotal: Decimal,
    ) -> PurchaseLine:
        line = PurchaseLine(
            purchase_id=purchase_id,
            product_id=product_id,
            quantity=quantity,
            unit_price=unit_price,
            discount=discount,
            line_subtotal=line_subtotal,
        )
        self._db.add(line)
        await self._db.flush()
        await self._db.refresh(line)
        return line

    async def update_line(
        self,
        purchase_line_id: int,
        quantity: int,
        unit_price: Decimal,
        discount: Decimal,
        line_subtotal: Decimal,
    ) -> PurchaseLine:
        result = await self._db.execute(
            select(PurchaseLine).where(
                PurchaseLine.purchase_line_id == purchase_line_id
            )
        )
        line = result.scalar_one()
        line.quantity = quantity
        line.unit_price = unit_price
        line.discount = discount
        line.line_subtotal = line_subtotal
        await self._db.flush()
        await self._db.refresh(line)
        return line

    async def delete_line(self, purchase_line_id: int) -> None:
        result = await self._db.execute(
            select(PurchaseLine).where(
                PurchaseLine.purchase_line_id == purchase_line_id
            )
        )
        line = result.scalar_one()
        await self._db.delete(line)
        await self._db.flush()

    async def update_totals(
        self,
        purchase_id: int,
        subtotal: Decimal,
        taxes: Decimal,
        total: Decimal,
    ) -> Purchase:
        result = await self._db.execute(
            select(Purchase).where(Purchase.purchase_id == purchase_id)
        )
        purchase = result.scalar_one()
        purchase.subtotal = subtotal
        purchase.taxes = taxes
        purchase.total = total
        await self._db.flush()
        await self._db.refresh(purchase, ["lines"])
        return purchase

    async def update_header(
        self,
        purchase_id: int,
        supplier_id: int,
        warehouse_id: int,
    ) -> Purchase:
        result = await self._db.execute(
            select(Purchase).where(Purchase.purchase_id == purchase_id)
        )
        purchase = result.scalar_one()
        purchase.supplier_id = supplier_id
        purchase.warehouse_id = warehouse_id
        await self._db.flush()
        await self._db.refresh(purchase, ["lines"])
        return purchase

    async def delete_all_lines(self, purchase_id: int) -> None:
        result = await self._db.execute(
            select(PurchaseLine).where(PurchaseLine.purchase_id == purchase_id)
        )
        for line in result.scalars().all():
            await self._db.delete(line)
        await self._db.flush()

    async def has_purchases_for_user(self, user_id: int) -> bool:
        result = await self._db.execute(
            select(func.count())
            .select_from(Purchase)
            .where(Purchase.user_id == user_id)
        )
        return result.scalar_one() > 0
