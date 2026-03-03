from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError

from composition.dependencies import (
    get_create_department_use_case,
    get_current_user,
    get_delete_department_use_case,
    get_get_department_use_case,
    get_list_departments_use_case,
    get_update_department_use_case,
)
from modules.admin.domain.interfaces.i_create_department_use_case import (
    ICreateDepartmentUseCase,
)
from modules.admin.domain.interfaces.i_delete_department_use_case import (
    IDeleteDepartmentUseCase,
)
from modules.admin.domain.interfaces.i_get_department_use_case import (
    IGetDepartmentUseCase,
)
from modules.admin.domain.interfaces.i_list_departments_use_case import (
    IListDepartmentsUseCase,
)
from modules.admin.domain.interfaces.i_update_department_use_case import (
    IUpdateDepartmentUseCase,
)
from modules.admin.infrastructure.http.schemas import (
    CreateDepartmentDTO,
    DepartmentDTO,
    UpdateDepartmentDTO,
)

router = APIRouter(prefix="/admin", tags=["Admin - Departments"])


@router.get("/departments", response_model=list[DepartmentDTO])
async def list_departments(
    use_case: IListDepartmentsUseCase = Depends(get_list_departments_use_case),
    _: dict = Depends(get_current_user),
):
    return await use_case.execute()


@router.post("/departments", response_model=DepartmentDTO, status_code=201)
async def create_department(
    body: CreateDepartmentDTO,
    use_case: ICreateDepartmentUseCase = Depends(get_create_department_use_case),
    _: dict = Depends(get_current_user),
):
    try:
        return await use_case.execute(body.name)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Department name already exists")


@router.put("/departments/{department_id}", response_model=DepartmentDTO)
async def update_department(
    department_id: int,
    body: UpdateDepartmentDTO,
    use_case: IUpdateDepartmentUseCase = Depends(get_update_department_use_case),
    _: dict = Depends(get_current_user),
):
    try:
        return await use_case.execute(department_id, body.name)
    except ValueError:
        raise HTTPException(status_code=404, detail="Department not found")
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Department name already exists")


@router.delete("/departments/{department_id}", status_code=204)
async def delete_department(
    department_id: int,
    use_case: IDeleteDepartmentUseCase = Depends(get_delete_department_use_case),
    _: dict = Depends(get_current_user),
):
    try:
        await use_case.execute(department_id)
    except ValueError as e:
        detail = str(e)
        status_code = 404 if "not found" in detail else 409
        raise HTTPException(status_code=status_code, detail=detail)


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
