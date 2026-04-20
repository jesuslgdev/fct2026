from __future__ import annotations

from datetime import UTC, datetime

from modules.dashboard.domain.dtos.dashboard import DashboardData
from modules.dashboard.domain.interfaces.repositories.i_dashboard_repository import (
    IDashboardRepository,
)
from modules.dashboard.domain.interfaces.use_cases.i_get_dashboard_use_case import (
    IGetDashboardUseCase,
)
from shared.domain.dtos.user_session import UserSession
from shared.domain.interfaces.i_department_reader import IDepartmentReader


class GetDashboardUseCase(IGetDashboardUseCase):
    def __init__(
        self,
        dashboard_repo: IDashboardRepository,
        department_reader: IDepartmentReader,
        stale_days: int,
        recent_limit: int,
    ) -> None:
        self._dashboard_repo = dashboard_repo
        self._department_reader = department_reader
        self._stale_days = max(stale_days, 1)
        self._recent_limit = min(max(recent_limit, 5), 10)

    async def execute(self, current_user: UserSession) -> DashboardData:
        generated_at = datetime.now(UTC)
        snapshot = await self._dashboard_repo.get_dashboard_data(
            generated_at=generated_at,
            stale_days=self._stale_days,
            recent_limit=self._recent_limit,
        )

        (
            can_view_purchases,
            can_view_sales,
            can_view_low_stock,
        ) = await self._resolve_visibility(current_user)

        return DashboardData(
            purchase_status_summary=(
                snapshot.purchase_status_summary if can_view_purchases else []
            ),
            sales_status_summary=snapshot.sales_status_summary
            if can_view_sales
            else [],
            latest_purchases=snapshot.latest_purchases if can_view_purchases else [],
            latest_sales=snapshot.latest_sales if can_view_sales else [],
            purchase_spend_comparison=(
                snapshot.purchase_spend_comparison if can_view_purchases else None
            ),
            low_stock_products=snapshot.low_stock_products
            if can_view_low_stock
            else [],
            stale_purchases=snapshot.stale_purchases if can_view_purchases else [],
            stale_sales=snapshot.stale_sales if can_view_sales else [],
            generated_at=snapshot.generated_at,
            stale_days=snapshot.stale_days,
            recent_limit=snapshot.recent_limit,
        )

    async def _resolve_visibility(
        self, current_user: UserSession
    ) -> tuple[bool, bool, bool]:
        if current_user.role == "Administrator":
            return True, True, True

        if current_user.department_id is None:
            return False, False, False

        department_name = await self._department_reader.get_name_by_id(
            current_user.department_id
        )
        if department_name == "Purchases":
            return True, False, True
        if department_name == "Sales":
            return False, True, True
        return False, False, False
