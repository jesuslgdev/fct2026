from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.application.create_department_use_case import CreateDepartmentUseCase
from modules.admin.application.get_department_use_case import GetDepartmentUseCase
from modules.admin.application.list_departments_use_case import ListDepartmentsUseCase
from modules.admin.application.update_department_use_case import UpdateDepartmentUseCase
from modules.admin.domain.interfaces.i_create_department_use_case import (
    ICreateDepartmentUseCase,
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
from modules.admin.infrastructure.repos.department_repository import (
    DepartmentRepository,
)
from shared.infrastructure.database.connection import get_db
from shared.infrastructure.security.firebase_auth_provider import verify_firebase_token

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    try:
        claims = verify_firebase_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    # TODO: look up user in DB and return domain entity
    return claims


async def get_create_department_use_case(
    db: AsyncSession = Depends(get_db),
) -> ICreateDepartmentUseCase:
    return CreateDepartmentUseCase(DepartmentRepository(db))


async def get_list_departments_use_case(
    db: AsyncSession = Depends(get_db),
) -> IListDepartmentsUseCase:
    return ListDepartmentsUseCase(DepartmentRepository(db))


async def get_get_department_use_case(
    db: AsyncSession = Depends(get_db),
) -> IGetDepartmentUseCase:
    return GetDepartmentUseCase(DepartmentRepository(db))


async def get_update_department_use_case(
    db: AsyncSession = Depends(get_db),
) -> IUpdateDepartmentUseCase:
    return UpdateDepartmentUseCase(DepartmentRepository(db))
