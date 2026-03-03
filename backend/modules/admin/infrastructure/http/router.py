from fastapi import APIRouter, Depends, HTTPException

from composition.dependencies import (
    get_current_user,
    get_get_department_use_case,
    get_list_departments_use_case,
)
from modules.admin.domain.interfaces.i_get_department_use_case import (
    IGetDepartmentUseCase,
)
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


@router.get("/departments/{department_id}", response_model=DepartmentDTO)
async def get_department(
    department_id: int,
    use_case: IGetDepartmentUseCase = Depends(get_get_department_use_case),
    _: dict = Depends(get_current_user),
):
    department = await use_case.execute(department_id)
    if department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    return department
