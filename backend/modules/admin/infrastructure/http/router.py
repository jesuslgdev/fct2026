from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.exc import IntegrityError

from composition.dependencies import (
    get_create_department_use_case,
    get_create_user_use_case,
    get_delete_department_use_case,
    get_get_department_use_case,
    get_get_user_use_case,
    get_list_departments_use_case,
    get_list_users_use_case,
    get_set_user_active_use_case,
    get_update_department_use_case,
    get_update_user_use_case,
)
from composition.security import require_admin
from modules.admin.domain.interfaces.use_cases.departments.i_create_department_use_case import (
    ICreateDepartmentUseCase,
)
from modules.admin.domain.interfaces.use_cases.departments.i_delete_department_use_case import (
    IDeleteDepartmentUseCase,
)
from modules.admin.domain.interfaces.use_cases.departments.i_get_department_use_case import (
    IGetDepartmentUseCase,
)
from modules.admin.domain.interfaces.use_cases.departments.i_list_departments_use_case import (
    IListDepartmentsUseCase,
)
from modules.admin.domain.interfaces.use_cases.departments.i_update_department_use_case import (
    IUpdateDepartmentUseCase,
)
from modules.admin.domain.interfaces.use_cases.users.i_create_user_use_case import (
    ICreateUserUseCase,
)
from modules.admin.domain.interfaces.use_cases.users.i_get_user_use_case import (
    IGetUserUseCase,
)
from modules.admin.domain.interfaces.use_cases.users.i_list_users_use_case import (
    IListUsersUseCase,
)
from modules.admin.domain.interfaces.use_cases.users.i_set_user_active_use_case import (
    ISetUserActiveUseCase,
)
from modules.admin.domain.interfaces.use_cases.users.i_update_user_use_case import (
    IUpdateUserUseCase,
)
from modules.admin.infrastructure.http.schemas import (
    CreateDepartmentDTO,
    CreateUserDTO,
    DepartmentDTO,
    PaginatedResponse,
    SetUserActiveDTO,
    UpdateDepartmentDTO,
    UpdateUserDTO,
    UserDTO,
)
from shared.domain.entities.user import User

router = APIRouter(prefix="/admin", tags=["Admin - Departments"])


def _to_user_dto(user: User) -> UserDTO:
    return UserDTO(
        user_id=user.user_id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role=user.role,
        department_id=user.department_id,
        is_active=user.is_active,
    )


@router.get("/departments", response_model=list[DepartmentDTO])
async def list_departments(
    use_case: IListDepartmentsUseCase = Depends(get_list_departments_use_case),
    _: dict = Depends(require_admin),
):
    results = await use_case.execute()
    return [DepartmentDTO(department_id=d.department_id, name=d.name) for d in results]


@router.post("/departments", response_model=DepartmentDTO, status_code=201)
async def create_department(
    body: CreateDepartmentDTO,
    use_case: ICreateDepartmentUseCase = Depends(get_create_department_use_case),
    _: dict = Depends(require_admin),
):
    try:
        result = await use_case.execute(body.name)
        return DepartmentDTO(department_id=result.department_id, name=result.name)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Department name already exists")


@router.put("/departments/{department_id}", response_model=DepartmentDTO)
async def update_department(
    department_id: int,
    body: UpdateDepartmentDTO,
    use_case: IUpdateDepartmentUseCase = Depends(get_update_department_use_case),
    _: dict = Depends(require_admin),
):
    try:
        result = await use_case.execute(department_id, body.name)
        return DepartmentDTO(department_id=result.department_id, name=result.name)
    except ValueError:
        raise HTTPException(status_code=404, detail="Department not found")
    except IntegrityError:
        raise HTTPException(status_code=409, detail="Department name already exists")


@router.delete("/departments/{department_id}", status_code=204)
async def delete_department(
    department_id: int,
    use_case: IDeleteDepartmentUseCase = Depends(get_delete_department_use_case),
    _: dict = Depends(require_admin),
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
    _: dict = Depends(require_admin),
):
    result = await use_case.execute(department_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Department not found")
    return DepartmentDTO(department_id=result.department_id, name=result.name)


@router.get("/users", response_model=PaginatedResponse[UserDTO], tags=["Admin - Users"])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    use_case: IListUsersUseCase = Depends(get_list_users_use_case),
    _: dict = Depends(require_admin),
):
    result = await use_case.execute(page, page_size)
    return PaginatedResponse(
        items=[_to_user_dto(u) for u in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


@router.get("/users/{user_id}", response_model=UserDTO, tags=["Admin - Users"])
async def get_user(
    user_id: int,
    use_case: IGetUserUseCase = Depends(get_get_user_use_case),
    _: dict = Depends(require_admin),
):
    result = await use_case.execute(user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_user_dto(result)


@router.post("/users", response_model=UserDTO, status_code=201, tags=["Admin - Users"])
async def create_user(
    body: CreateUserDTO,
    use_case: ICreateUserUseCase = Depends(get_create_user_use_case),
    _: dict = Depends(require_admin),
):
    try:
        result = await use_case.execute(
            body.first_name, body.last_name, body.email, body.role, body.department_id
        )
        return _to_user_dto(result)
    except ValueError as e:
        detail = str(e)
        status_code = 409 if "Email" in detail else 404
        raise HTTPException(status_code=status_code, detail=detail)


@router.put("/users/{user_id}", response_model=UserDTO, tags=["Admin - Users"])
async def update_user(
    user_id: int,
    body: UpdateUserDTO,
    use_case: IUpdateUserUseCase = Depends(get_update_user_use_case),
    _: dict = Depends(require_admin),
):
    try:
        result = await use_case.execute(
            user_id, body.first_name, body.last_name, body.role, body.department_id
        )
        return _to_user_dto(result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/users/{user_id}/active", status_code=204, tags=["Admin - Users"])
async def set_user_active(
    user_id: int,
    body: SetUserActiveDTO,
    use_case: ISetUserActiveUseCase = Depends(get_set_user_active_use_case),
    _: dict = Depends(require_admin),
):
    try:
        await use_case.execute(user_id, body.is_active)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return Response(status_code=204)
