from __future__ import annotations

from datetime import UTC, datetime

from modules.dashboard.domain.dtos.dashboard import DashboardData
from modules.dashboard.domain.interfaces.repositories.i_dashboard_repository import (
    IDashboardRepository,
)
from modules.dashboard.domain.interfaces.use_cases.i_get_dashboard_use_case import (
    IGetDashboardUseCase,
)


class GetDashboardUseCase(IGetDashboardUseCase):
    def __init__(
        self,
        dashboard_repo: IDashboardRepository,
        stale_days: int,
        recent_limit: int,
    ) -> None:
        self._dashboard_repo = dashboard_repo
        self._stale_days = max(stale_days, 1)
        self._recent_limit = min(max(recent_limit, 5), 10)

    async def execute(self) -> DashboardData:
        generated_at = datetime.now(UTC)
        snapshot = await self._dashboard_repo.get_dashboard_data(
            generated_at=generated_at,
            stale_days=self._stale_days,
            recent_limit=self._recent_limit,
        )
        return snapshot
