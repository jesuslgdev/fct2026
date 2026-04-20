from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime

from modules.dashboard.domain.dtos.dashboard import DashboardData


class IDashboardRepository(ABC):
    @abstractmethod
    async def get_dashboard_data(
        self,
        generated_at: datetime,
        stale_days: int,
        recent_limit: int,
    ) -> DashboardData:
        """Return a full dashboard snapshot before role-based filtering."""
        ...
