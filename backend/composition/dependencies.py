from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.application.create_department_use_case import CreateDepartmentUseCase
from modules.admin.application.delete_department_use_case import DeleteDepartmentUseCase
from modules.admin.application.get_department_use_case import GetDepartmentUseCase
from modules.admin.application.list_departments_use_case import ListDepartmentsUseCase
from modules.admin.application.update_department_use_case import UpdateDepartmentUseCase
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
from modules.admin.infrastructure.repos.department_repository import (
    DepartmentRepository,
)
from modules.auth.domain.entities.user_session import UserSession
from modules.auth.infrastructure.repos.auth_repository import AuthRepository
from shared.infrastructure.database.connection import get_db
from shared.infrastructure.security.firebase_auth_provider import verify_firebase_token

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> UserSession:
    try:
        claims = verify_firebase_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


    user = await AuthRepository(db).find_active_user_by_email(claims["email"])

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return UserSession(
        email=user.email,
        role=user.role,
        department_id=user.department_id,
        firebase_uid=claims["uid"],
        name=f"{user.first_name} {user.last_name}",
    )


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


async def get_delete_department_use_case(
    db: AsyncSession = Depends(get_db),
) -> IDeleteDepartmentUseCase:
    return DeleteDepartmentUseCase(DepartmentRepository(db))
