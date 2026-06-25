from fastapi import APIRouter, Depends

from composition.dependencies import get_dashboard_use_case
from composition.security import get_current_user
from modules.dashboard.domain.interfaces.use_cases.i_get_dashboard_use_case import (
    IGetDashboardUseCase,
)
from modules.dashboard.infrastructure.http.schemas import DashboardResponseDTO

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponseDTO)
async def get_dashboard(
    _: dict = Depends(get_current_user),
    use_case: IGetDashboardUseCase = Depends(get_dashboard_use_case),
):
    """Return full dashboard aggregates for the authenticated user."""
    result = await use_case.execute()
    return DashboardResponseDTO.from_domain(result)
