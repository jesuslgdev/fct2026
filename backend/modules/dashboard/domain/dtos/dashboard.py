from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass(frozen=True)
class DashboardStatusSummary:
    status: str
    count: int


@dataclass(frozen=True)
class DashboardRecentRecord:
    number: str
    counterpart_name: str | None
    status: str
    total: Decimal
    created_at: datetime


@dataclass(frozen=True)
class DashboardSpendComparison:
    current_month: Decimal
    previous_month: Decimal
    difference_amount: Decimal
    difference_percent: Decimal | None


@dataclass(frozen=True)
class DashboardLowStockProduct:
    product_id: int
    product_code: str
    product_name: str
    stock_current: int
    stock_min: int


@dataclass(frozen=True)
class DashboardStaleRecord:
    number: str
    status: str
    status_changed_at: datetime
    days_in_status: int


@dataclass(frozen=True)
class DashboardData:
    purchase_status_summary: list[DashboardStatusSummary]
    sales_status_summary: list[DashboardStatusSummary]
    latest_purchases: list[DashboardRecentRecord]
    latest_sales: list[DashboardRecentRecord]
    purchase_spend_comparison: DashboardSpendComparison | None
    low_stock_products: list[DashboardLowStockProduct]
    stale_purchases: list[DashboardStaleRecord]
    stale_sales: list[DashboardStaleRecord]
    generated_at: datetime
    stale_days: int
    recent_limit: int
