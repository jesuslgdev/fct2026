from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.purchases.domain.entities.purchase import Purchase
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.suppliers.domain.entities.supplier import Supplier
from shared.domain.paginated_result import PaginatedResult

SORT_FIELDS = {
    "purchase_number": Purchase.purchase_number,
    "supplier_name": Supplier.name,
    "status": Purchase.status,
    "created_at": Purchase.created_at,
    "total": Purchase.total,
}


class PurchaseRepository(IPurchaseRepository):
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
    ) -> PaginatedResult[tuple]:
        filters = []
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
