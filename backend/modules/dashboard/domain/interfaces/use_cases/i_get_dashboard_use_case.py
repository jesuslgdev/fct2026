from __future__ import annotations

from abc import ABC, abstractmethod

from modules.dashboard.domain.dtos.dashboard import DashboardData


class IGetDashboardUseCase(ABC):
    @abstractmethod
    async def execute(self) -> DashboardData:
        """Return full dashboard data for the authenticated user."""
        ...
