from fastapi import APIRouter, Depends

from composition.dependencies import get_current_user, get_list_departments_use_case
from modules.admin.domain.interfaces.i_list_departments_use_case import (
    IListDepartmentsUseCase,
)
from modules.admin.infrastructure.http.schemas import DepartmentDTO

router = APIRouter(prefix="/admin", tags=["Admin - Departments"])


@router.get("/departments", response_model=list[DepartmentDTO])
async def list_departments(
    use_case: IListDepartmentsUseCase = Depends(get_list_departments_use_case),
    _: dict = Depends(get_current_user),
):
    return await use_case.execute()
