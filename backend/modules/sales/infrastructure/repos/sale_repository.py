from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from modules.clients.domain.entities.client import Client
from modules.sales.domain.entities.sale import Sale
from modules.sales.domain.entities.sale_line import SaleLine
from modules.sales.domain.entities.sale_status_history import SaleStatusHistory
from modules.sales.domain.interfaces.repositories.i_sale_repository import (
    ISaleRepository,
)
from shared.domain.dtos.paginated_result import PaginatedResult
from shared.domain.entities.user import User
from shared.domain.interfaces.i_sale_reader import ISaleReader

SORT_FIELDS = {
    "sale_number": Sale.sale_number,
    "client_name": Client.name,
    "status": Sale.status,
    "sale_date": Sale.sale_date,
    "total": Sale.total,
    "created_at": Sale.created_at,
}


class SaleRepository(ISaleRepository, ISaleReader):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def has_sales_for_user(self, user_id: int) -> bool:
        result = await self._db.execute(
            select(func.count()).select_from(Sale).where(Sale.user_id == user_id)
        )
        return result.scalar_one() > 0

    async def generate_sale_number(self) -> str:
        year = datetime.now().year
        prefix = f"VEN-{year}-"
        result = await self._db.execute(
            text("SELECT MAX(sale_number) FROM sales WHERE sale_number LIKE :pattern"),
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
        sale_number: str,
        client_id: int,
        warehouse_id: int,
        delivery_address: str,
        user_id: int,
        status: str,
        subtotal: Decimal,
        taxes: Decimal,
        total: Decimal,
        lines: list[dict],
    ) -> Sale:
        sale = Sale(
            sale_number=sale_number,
            client_id=client_id,
            warehouse_id=warehouse_id,
            delivery_address=delivery_address,
            user_id=user_id,
            status=status,
            status_changed_at=datetime.now(UTC),
            subtotal=subtotal,
            taxes=taxes,
            total=total,
        )
        self._db.add(sale)
        await self._db.flush()

        for line in lines:
            sale_line = SaleLine(
                sale_id=sale.sale_id,
                product_id=line["product_id"],
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                discount=line.get("discount", Decimal("0")),
                vat_rate=line["vat_rate"],
                line_subtotal=line["line_subtotal"],
                line_tax=line["line_tax"],
            )
            self._db.add(sale_line)

        await self._db.flush()
        await self._db.refresh(sale)
        return sale

    async def save(self, sale: Sale) -> Sale:
        self._db.add(sale)
        await self._db.flush()
        await self._db.refresh(sale)
        return sale

    async def add_status_history(self, history: SaleStatusHistory) -> None:
        self._db.add(history)
        await self._db.flush()
        await self._db.refresh(history)

    async def delete_sale(self, sale_id: int) -> None:
        status_history_result = await self._db.execute(
            select(SaleStatusHistory).where(SaleStatusHistory.sale_id == sale_id)
        )
        for history_item in status_history_result.scalars().all():
            await self._db.delete(history_item)

        sale_lines_result = await self._db.execute(
            select(SaleLine).where(SaleLine.sale_id == sale_id)
        )
        for line in sale_lines_result.scalars().all():
            await self._db.delete(line)

        sale_result = await self._db.execute(
            select(Sale).where(Sale.sale_id == sale_id)
        )
        sale = sale_result.scalar_one()
        await self._db.delete(sale)
        await self._db.flush()

    async def get_by_id(self, sale_id: int) -> Sale | None:
        result = await self._db.execute(select(Sale).where(Sale.sale_id == sale_id))
        return result.scalar_one_or_none()

    async def update(
        self,
        sale_id: int,
        client_id: int,
        delivery_address: str,
        subtotal: Decimal,
        taxes: Decimal,
        total: Decimal,
        lines: list[dict],
    ) -> Sale:
        result = await self._db.execute(select(Sale).where(Sale.sale_id == sale_id))
        sale = result.scalar_one()
        sale.client_id = client_id
        sale.delivery_address = delivery_address
        sale.subtotal = subtotal
        sale.taxes = taxes
        sale.total = total

        existing_lines_result = await self._db.execute(
            select(SaleLine).where(SaleLine.sale_id == sale_id)
        )
        for existing_line in existing_lines_result.scalars().all():
            await self._db.delete(existing_line)

        await self._db.flush()

        for line in lines:
            sale_line = SaleLine(
                sale_id=sale.sale_id,
                product_id=line["product_id"],
                quantity=line["quantity"],
                unit_price=line["unit_price"],
                discount=line.get("discount", Decimal("0")),
                vat_rate=line["vat_rate"],
                line_subtotal=line["line_subtotal"],
                line_tax=line["line_tax"],
            )
            self._db.add(sale_line)

        await self._db.flush()
        await self._db.refresh(sale, ["lines"])
        updated_sale = await self.get_by_id(sale_id)
        return updated_sale if updated_sale is not None else sale

    async def get_all_paginated(
        self,
        page: int,
        page_size: int,
        sort_field: str,
        sort_order: str,
        status: str | None,
        client_id: int | None,
        date_from: datetime | None,
        date_to: datetime | None,
        search: str | None = None,
    ) -> PaginatedResult:
        filters = []
        if search:
            pattern = f"%{search}%"
            filters.append(Sale.sale_number.ilike(pattern) | Client.name.ilike(pattern))
        if status:
            filters.append(Sale.status == status)
        if client_id:
            filters.append(Sale.client_id == client_id)
        if date_from:
            filters.append(Sale.sale_date >= date_from)
        if date_to:
            filters.append(Sale.sale_date <= date_to)

        count_stmt = (
            select(func.count())
            .select_from(Sale)
            .outerjoin(Client, Sale.client_id == Client.client_id)
            .where(*filters)
        )
        total_result = await self._db.execute(count_stmt)
        total = total_result.scalar_one()

        order_col = SORT_FIELDS.get(sort_field, Sale.created_at)
        order_expr = order_col.desc() if sort_order == "desc" else order_col.asc()
        offset = (page - 1) * page_size

        data_stmt = (
            select(
                Sale,
                Client.name.label("client_name"),
                func.concat(User.first_name, " ", User.last_name).label("creator_name"),
            )
            .outerjoin(Client, Sale.client_id == Client.client_id)
            .outerjoin(User, Sale.user_id == User.user_id)
            .where(*filters)
            .order_by(order_expr)
            .limit(page_size)
            .offset(offset)
        )

        result = await self._db.execute(data_stmt)
        items = list(result.all())

        return PaginatedResult(items=items, total=total, page=page, page_size=page_size)
