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
from modules.catalog.application.categories.create_category_use_case import (
    CreateCategoryUseCase,
)
from modules.catalog.application.categories.delete_category_use_case import (
    DeleteCategoryUseCase,
)
from modules.catalog.application.categories.list_categories_use_case import (
    ListCategoriesUseCase,
)
from modules.catalog.application.categories.update_category_use_case import (
    UpdateCategoryUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_create_category_use_case import (
    ICreateCategoryUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_delete_category_use_case import (
    IDeleteCategoryUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_list_categories_use_case import (
    IListCategoriesUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_update_category_use_case import (
    IUpdateCategoryUseCase,
)
from modules.catalog.infrastructure.repos.category_repository import CategoryRepository
from modules.clients.application.create_client_use_case import CreateClientUseCase
from modules.clients.application.get_client_use_case import GetClientUseCase
from modules.clients.application.list_clients_use_case import ListClientsUseCase
from modules.clients.application.set_client_active_use_case import (
    SetClientActiveUseCase,
)
from modules.clients.application.update_client_use_case import UpdateClientUseCase
from modules.clients.domain.interfaces.use_cases.i_create_client_use_case import (
    ICreateClientUseCase,
)
from modules.clients.domain.interfaces.use_cases.i_get_client_use_case import (
    IGetClientUseCase,
)
from modules.clients.domain.interfaces.use_cases.i_list_clients_use_case import (
    IListClientsUseCase,
)
from modules.clients.domain.interfaces.use_cases.i_set_client_active_use_case import (
    ISetClientActiveUseCase,
)
from modules.clients.domain.interfaces.use_cases.i_update_client_use_case import (
    IUpdateClientUseCase,
)
from modules.clients.infrastructure.repos.client_repository import ClientRepository
from modules.suppliers.application.download_supplier_template_use_case import (
    DownloadSupplierTemplateUseCase,
)
from modules.suppliers.application.get_supplier_use_case import GetSupplierUseCase
from modules.suppliers.application.import_suppliers_use_case import (
    ImportSuppliersUseCase,
)
from modules.suppliers.application.list_suppliers_use_case import ListSuppliersUseCase
from modules.suppliers.application.set_supplier_active_use_case import (
    SetSupplierActiveUseCase,
)
from modules.suppliers.application.update_supplier_use_case import UpdateSupplierUseCase
from modules.suppliers.domain.interfaces.use_cases.i_download_supplier_template_use_case import (
    IDownloadSupplierTemplateUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_get_supplier_use_case import (
    IGetSupplierUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_import_suppliers_use_case import (
    IImportSuppliersUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_list_suppliers_use_case import (
    IListSuppliersUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_set_supplier_active_use_case import (
    ISetSupplierActiveUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_update_supplier_use_case import (
    IUpdateSupplierUseCase,
)
from modules.suppliers.infrastructure.repos.supplier_repository import (
    SupplierRepository,
)
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


async def get_list_categories_use_case(
    db: AsyncSession = Depends(get_db),
) -> IListCategoriesUseCase:
    return ListCategoriesUseCase(CategoryRepository(db))


async def get_create_category_use_case(
    db: AsyncSession = Depends(get_db),
) -> ICreateCategoryUseCase:
    return CreateCategoryUseCase(CategoryRepository(db))


async def get_update_category_use_case(
    db: AsyncSession = Depends(get_db),
) -> IUpdateCategoryUseCase:
    return UpdateCategoryUseCase(CategoryRepository(db))


async def get_delete_category_use_case(
    db: AsyncSession = Depends(get_db),
) -> IDeleteCategoryUseCase:
    return DeleteCategoryUseCase(CategoryRepository(db))


def get_download_supplier_template_use_case() -> IDownloadSupplierTemplateUseCase:
    return DownloadSupplierTemplateUseCase()


async def get_import_suppliers_use_case(
    db: AsyncSession = Depends(get_db),
) -> IImportSuppliersUseCase:
    return ImportSuppliersUseCase(SupplierRepository(db))


async def get_list_suppliers_use_case(
    db: AsyncSession = Depends(get_db),
) -> IListSuppliersUseCase:
    return ListSuppliersUseCase(SupplierRepository(db))


async def get_get_supplier_use_case(
    db: AsyncSession = Depends(get_db),
) -> IGetSupplierUseCase:
    return GetSupplierUseCase(SupplierRepository(db))


async def get_update_supplier_use_case(
    db: AsyncSession = Depends(get_db),
) -> IUpdateSupplierUseCase:
    return UpdateSupplierUseCase(SupplierRepository(db))


async def get_set_supplier_active_use_case(
    db: AsyncSession = Depends(get_db),
) -> ISetSupplierActiveUseCase:
    return SetSupplierActiveUseCase(SupplierRepository(db))


async def get_list_clients_use_case(
    db: AsyncSession = Depends(get_db),
) -> IListClientsUseCase:
    return ListClientsUseCase(ClientRepository(db))


async def get_get_client_use_case(
    db: AsyncSession = Depends(get_db),
) -> IGetClientUseCase:
    return GetClientUseCase(ClientRepository(db))


async def get_create_client_use_case(
    db: AsyncSession = Depends(get_db),
) -> ICreateClientUseCase:
    return CreateClientUseCase(ClientRepository(db))


async def get_update_client_use_case(
    db: AsyncSession = Depends(get_db),
) -> IUpdateClientUseCase:
    return UpdateClientUseCase(ClientRepository(db))


async def get_set_client_active_use_case(
    db: AsyncSession = Depends(get_db),
) -> ISetClientActiveUseCase:
    return SetClientActiveUseCase(ClientRepository(db))
