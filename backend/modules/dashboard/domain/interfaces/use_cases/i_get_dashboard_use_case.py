from __future__ import annotations

from abc import ABC, abstractmethod

from modules.dashboard.domain.dtos.dashboard import DashboardData
from shared.domain.dtos.user_session import UserSession


class IGetDashboardUseCase(ABC):
    @abstractmethod
    async def execute(self, current_user: UserSession) -> DashboardData:
        """Return full dashboard data for the authenticated user."""
        ...
