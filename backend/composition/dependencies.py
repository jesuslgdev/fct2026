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
from modules.admin.infrastructure.repos.department_repository import (
    DepartmentRepository,
)
from shared.infrastructure.database.connection import get_db


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
