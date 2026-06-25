from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.dashboard.domain.dtos.dashboard import (
    DashboardData,
    DashboardLowStockProduct,
    DashboardRecentRecord,
    DashboardSpendComparison,
    DashboardStaleRecord,
    DashboardStatusSummary,
)
from modules.dashboard.domain.interfaces.repositories.i_dashboard_repository import (
    IDashboardRepository,
)
from shared.infrastructure.database.read_tables import (
    clients_table,
    products_table,
    purchases_table,
    sales_table,
    suppliers_table,
    warehouse_stock_table,
)


class DashboardRepository(IDashboardRepository):
    _FINAL_PURCHASE_STATUSES = {"Received", "Cancelled"}
    _FINAL_SALE_STATUSES = {"Delivered", "Cancelled"}

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_dashboard_data(
        self,
        generated_at: datetime,
        stale_days: int,
        recent_limit: int,
    ) -> DashboardData:
        current_month_start = datetime(
            generated_at.year, generated_at.month, 1, tzinfo=UTC
        )
        previous_month_start = self._previous_month_start(current_month_start)
        next_month_start = self._next_month_start(current_month_start)
        stale_cutoff = generated_at - timedelta(days=stale_days)

        purchase_status_summary = await self._status_summary(purchases_table)
        sales_status_summary = await self._status_summary(sales_table)
        latest_purchases = await self._latest_purchases(recent_limit)
        latest_sales = await self._latest_sales(recent_limit)
        purchase_spend_comparison = await self._spend_comparison(
            previous_month_start=previous_month_start,
            current_month_start=current_month_start,
            next_month_start=next_month_start,
        )
        low_stock_products = await self._low_stock_products()
        stale_purchases = await self._stale_purchases(
            generated_at=generated_at, stale_cutoff=stale_cutoff
        )
        stale_sales = await self._stale_sales(
            generated_at=generated_at, stale_cutoff=stale_cutoff
        )

        return DashboardData(
            purchase_status_summary=purchase_status_summary,
            sales_status_summary=sales_status_summary,
            latest_purchases=latest_purchases,
            latest_sales=latest_sales,
            purchase_spend_comparison=purchase_spend_comparison,
            low_stock_products=low_stock_products,
            stale_purchases=stale_purchases,
            stale_sales=stale_sales,
            generated_at=generated_at,
            stale_days=stale_days,
            recent_limit=recent_limit,
        )

    async def _status_summary(self, table) -> list[DashboardStatusSummary]:
        result = await self._db.execute(
            select(table.c.status, func.count().label("count"))
            .group_by(table.c.status)
            .order_by(table.c.status.asc())
        )
        return [
            DashboardStatusSummary(status=row.status, count=int(row.count))
            for row in result.all()
        ]

    async def _latest_purchases(self, recent_limit: int) -> list[DashboardRecentRecord]:
        query = (
            select(
                purchases_table.c.purchase_number.label("number"),
                suppliers_table.c.name.label("counterpart_name"),
                purchases_table.c.status,
                purchases_table.c.total,
                purchases_table.c.created_at,
            )
            .select_from(
                purchases_table.outerjoin(
                    suppliers_table,
                    purchases_table.c.supplier_id == suppliers_table.c.supplier_id,
                )
            )
            .order_by(purchases_table.c.created_at.desc())
            .limit(recent_limit)
        )
        result = await self._db.execute(query)
        return [
            DashboardRecentRecord(
                number=row.number,
                counterpart_name=row.counterpart_name,
                status=row.status,
                total=row.total if row.total is not None else Decimal("0"),
                created_at=row.created_at,
            )
            for row in result.all()
        ]

    async def _latest_sales(self, recent_limit: int) -> list[DashboardRecentRecord]:
        query = (
            select(
                sales_table.c.sale_number.label("number"),
                clients_table.c.name.label("counterpart_name"),
                sales_table.c.status,
                sales_table.c.total,
                sales_table.c.created_at,
            )
            .select_from(
                sales_table.outerjoin(
                    clients_table,
                    sales_table.c.client_id == clients_table.c.client_id,
                )
            )
            .order_by(sales_table.c.created_at.desc())
            .limit(recent_limit)
        )
        result = await self._db.execute(query)
        return [
            DashboardRecentRecord(
                number=row.number,
                counterpart_name=row.counterpart_name,
                status=row.status,
                total=row.total if row.total is not None else Decimal("0"),
                created_at=row.created_at,
            )
            for row in result.all()
        ]

    async def _spend_comparison(
        self,
        previous_month_start: datetime,
        current_month_start: datetime,
        next_month_start: datetime,
    ) -> DashboardSpendComparison:
        previous_month_total = await self._sum_received_purchases(
            start=previous_month_start, end=current_month_start
        )
        current_month_total = await self._sum_received_purchases(
            start=current_month_start, end=next_month_start
        )
        difference_amount = current_month_total - previous_month_total

        difference_percent: Decimal | None = None
        if previous_month_total != Decimal("0"):
            difference_percent = (
                difference_amount / previous_month_total * Decimal("100")
            ).quantize(Decimal("0.01"))

        return DashboardSpendComparison(
            current_month=current_month_total,
            previous_month=previous_month_total,
            difference_amount=difference_amount,
            difference_percent=difference_percent,
        )

    async def _sum_received_purchases(self, start: datetime, end: datetime) -> Decimal:
        result = await self._db.execute(
            select(func.coalesce(func.sum(purchases_table.c.total), 0))
            .where(purchases_table.c.status == "Received")
            .where(purchases_table.c.purchase_date >= start)
            .where(purchases_table.c.purchase_date < end)
        )
        total = result.scalar_one()
        return total if isinstance(total, Decimal) else Decimal(str(total))

    async def _low_stock_products(self) -> list[DashboardLowStockProduct]:
        stock_total = func.coalesce(func.sum(warehouse_stock_table.c.stock), 0)
        result = await self._db.execute(
            select(
                products_table.c.product_id,
                products_table.c.product_code,
                products_table.c.name.label("product_name"),
                stock_total.label("stock_current"),
                products_table.c.stock_min,
            )
            .select_from(
                products_table.outerjoin(
                    warehouse_stock_table,
                    warehouse_stock_table.c.product_id == products_table.c.product_id,
                )
            )
            .group_by(
                products_table.c.product_id,
                products_table.c.product_code,
                products_table.c.name,
                products_table.c.stock_min,
            )
            .having(stock_total < products_table.c.stock_min)
            .order_by(stock_total.asc(), products_table.c.name.asc())
        )
        return [
            DashboardLowStockProduct(
                product_id=row.product_id,
                product_code=row.product_code,
                product_name=row.product_name,
                stock_current=int(row.stock_current),
                stock_min=int(row.stock_min),
            )
            for row in result.all()
        ]

    async def _stale_purchases(
        self,
        generated_at: datetime,
        stale_cutoff: datetime,
    ) -> list[DashboardStaleRecord]:
        result = await self._db.execute(
            select(
                purchases_table.c.purchase_number.label("number"),
                purchases_table.c.status,
                purchases_table.c.status_changed_at,
                purchases_table.c.created_at,
            )
            .where(purchases_table.c.status_changed_at <= stale_cutoff)
            .where(purchases_table.c.status.not_in(self._FINAL_PURCHASE_STATUSES))
            .order_by(purchases_table.c.status_changed_at.asc())
        )
        return self._map_stale_rows(result.all(), generated_at)

    async def _stale_sales(
        self,
        generated_at: datetime,
        stale_cutoff: datetime,
    ) -> list[DashboardStaleRecord]:
        result = await self._db.execute(
            select(
                sales_table.c.sale_number.label("number"),
                sales_table.c.status,
                sales_table.c.status_changed_at,
                sales_table.c.created_at,
            )
            .where(sales_table.c.status_changed_at <= stale_cutoff)
            .where(sales_table.c.status.not_in(self._FINAL_SALE_STATUSES))
            .order_by(sales_table.c.status_changed_at.asc())
        )
        return self._map_stale_rows(result.all(), generated_at)

    @staticmethod
    def _map_stale_rows(rows, generated_at: datetime) -> list[DashboardStaleRecord]:
        records: list[DashboardStaleRecord] = []
        for row in rows:
            status_changed_at = row.status_changed_at or row.created_at or generated_at
            days_in_status = max((generated_at - status_changed_at).days, 0)
            records.append(
                DashboardStaleRecord(
                    number=row.number,
                    status=row.status,
                    status_changed_at=status_changed_at,
                    days_in_status=days_in_status,
                )
            )
        return records

    @staticmethod
    def _previous_month_start(current_month_start: datetime) -> datetime:
        if current_month_start.month == 1:
            return datetime(current_month_start.year - 1, 12, 1, tzinfo=UTC)
        return datetime(
            current_month_start.year, current_month_start.month - 1, 1, tzinfo=UTC
        )

    @staticmethod
    def _next_month_start(current_month_start: datetime) -> datetime:
        if current_month_start.month == 12:
            return datetime(current_month_start.year + 1, 1, 1, tzinfo=UTC)
        return datetime(
            current_month_start.year, current_month_start.month + 1, 1, tzinfo=UTC
        )
