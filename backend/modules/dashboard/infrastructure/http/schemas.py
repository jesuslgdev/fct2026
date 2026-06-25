from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from modules.dashboard.domain.dtos.dashboard import DashboardData


class DashboardStatusSummaryDTO(BaseModel):
    status: str
    count: int


class DashboardRecentRecordDTO(BaseModel):
    number: str
    counterpart_name: str | None
    status: str
    total: Decimal
    created_at: datetime


class DashboardSpendComparisonDTO(BaseModel):
    current_month: Decimal
    previous_month: Decimal
    difference_amount: Decimal
    difference_percent: Decimal | None


class DashboardLowStockProductDTO(BaseModel):
    product_id: int
    product_code: str
    product_name: str
    stock_current: int
    stock_min: int


class DashboardStaleRecordDTO(BaseModel):
    number: str
    status: str
    status_changed_at: datetime
    days_in_status: int


class DashboardMetaDTO(BaseModel):
    generated_at: datetime
    stale_days: int
    recent_limit: int


class DashboardResponseDTO(BaseModel):
    purchase_status_summary: list[DashboardStatusSummaryDTO]
    sales_status_summary: list[DashboardStatusSummaryDTO]
    latest_purchases: list[DashboardRecentRecordDTO]
    latest_sales: list[DashboardRecentRecordDTO]
    purchase_spend_comparison: DashboardSpendComparisonDTO | None
    low_stock_products: list[DashboardLowStockProductDTO]
    stale_purchases: list[DashboardStaleRecordDTO]
    stale_sales: list[DashboardStaleRecordDTO]
    meta: DashboardMetaDTO

    @classmethod
    def from_domain(cls, dashboard: DashboardData) -> DashboardResponseDTO:
        spend = dashboard.purchase_spend_comparison
        return cls(
            purchase_status_summary=[
                DashboardStatusSummaryDTO(status=item.status, count=item.count)
                for item in dashboard.purchase_status_summary
            ],
            sales_status_summary=[
                DashboardStatusSummaryDTO(status=item.status, count=item.count)
                for item in dashboard.sales_status_summary
            ],
            latest_purchases=[
                DashboardRecentRecordDTO(
                    number=item.number,
                    counterpart_name=item.counterpart_name,
                    status=item.status,
                    total=item.total,
                    created_at=item.created_at,
                )
                for item in dashboard.latest_purchases
            ],
            latest_sales=[
                DashboardRecentRecordDTO(
                    number=item.number,
                    counterpart_name=item.counterpart_name,
                    status=item.status,
                    total=item.total,
                    created_at=item.created_at,
                )
                for item in dashboard.latest_sales
            ],
            purchase_spend_comparison=(
                DashboardSpendComparisonDTO(
                    current_month=spend.current_month,
                    previous_month=spend.previous_month,
                    difference_amount=spend.difference_amount,
                    difference_percent=spend.difference_percent,
                )
                if spend is not None
                else None
            ),
            low_stock_products=[
                DashboardLowStockProductDTO(
                    product_id=item.product_id,
                    product_code=item.product_code,
                    product_name=item.product_name,
                    stock_current=item.stock_current,
                    stock_min=item.stock_min,
                )
                for item in dashboard.low_stock_products
            ],
            stale_purchases=[
                DashboardStaleRecordDTO(
                    number=item.number,
                    status=item.status,
                    status_changed_at=item.status_changed_at,
                    days_in_status=item.days_in_status,
                )
                for item in dashboard.stale_purchases
            ],
            stale_sales=[
                DashboardStaleRecordDTO(
                    number=item.number,
                    status=item.status,
                    status_changed_at=item.status_changed_at,
                    days_in_status=item.days_in_status,
                )
                for item in dashboard.stale_sales
            ],
            meta=DashboardMetaDTO(
                generated_at=dashboard.generated_at,
                stale_days=dashboard.stale_days,
                recent_limit=dashboard.recent_limit,
            ),
        )
