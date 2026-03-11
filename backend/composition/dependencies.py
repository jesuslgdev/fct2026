from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.application.departments.create_department_use_case import (
    CreateDepartmentUseCase,
)
from modules.admin.application.departments.delete_department_use_case import (
    DeleteDepartmentUseCase,
)
from modules.admin.application.departments.get_department_use_case import (
    GetDepartmentUseCase,
)
from modules.admin.application.departments.list_departments_use_case import (
    ListDepartmentsUseCase,
)
from modules.admin.application.departments.update_department_use_case import (
    UpdateDepartmentUseCase,
)
from modules.admin.application.users.create_user_use_case import CreateUserUseCase
from modules.admin.application.users.get_user_use_case import GetUserUseCase
from modules.admin.application.users.list_users_use_case import ListUsersUseCase
from modules.admin.application.users.set_user_active_use_case import (
    SetUserActiveUseCase,
)
from modules.admin.application.users.update_user_use_case import UpdateUserUseCase
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
from modules.admin.infrastructure.repos.department_repository import (
    DepartmentRepository,
)
from modules.admin.infrastructure.repos.user_repository import UserRepository
from modules.auth.application.login_use_case import LoginUseCase
from modules.auth.application.logout_use_case import LogoutUseCase
from modules.auth.domain.interfaces.use_cases.i_login_use_case import ILoginUseCase
from modules.auth.domain.interfaces.use_cases.i_logout_use_case import ILogoutUseCase
from modules.auth.infrastructure.repos.auth_repository import AuthRepository
from shared.infrastructure.database.connection import get_db


async def get_login_use_case(
    db: AsyncSession = Depends(get_db),
) -> ILoginUseCase:
    return LoginUseCase(AuthRepository(db))


def get_logout_use_case() -> ILogoutUseCase:
    return LogoutUseCase()


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


async def get_list_users_use_case(
    db: AsyncSession = Depends(get_db),
) -> IListUsersUseCase:
    return ListUsersUseCase(UserRepository(db))


async def get_get_user_use_case(
    db: AsyncSession = Depends(get_db),
) -> IGetUserUseCase:
    return GetUserUseCase(UserRepository(db))


async def get_create_user_use_case(
    db: AsyncSession = Depends(get_db),
) -> ICreateUserUseCase:
    return CreateUserUseCase(UserRepository(db), DepartmentRepository(db))


async def get_update_user_use_case(
    db: AsyncSession = Depends(get_db),
) -> IUpdateUserUseCase:
    return UpdateUserUseCase(UserRepository(db), DepartmentRepository(db))


async def get_set_user_active_use_case(
    db: AsyncSession = Depends(get_db),
) -> ISetUserActiveUseCase:
    return SetUserActiveUseCase(UserRepository(db))
