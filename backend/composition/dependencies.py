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
from modules.catalog.application.categories.get_category_use_case import (
    GetCategoryUseCase,
)
from modules.catalog.application.categories.list_categories_use_case import (
    ListCategoriesUseCase,
)
from modules.catalog.application.categories.update_category_use_case import (
    UpdateCategoryUseCase,
)
from modules.catalog.application.products.create_product_use_case import (
    CreateProductUseCase,
)
from modules.catalog.application.products.get_product_use_case import (
    GetProductUseCase,
)
from modules.catalog.application.products.list_products_use_case import (
    ListProductsUseCase,
)
from modules.catalog.application.products.set_product_active_use_case import (
    SetProductActiveUseCase,
)
from modules.catalog.application.products.update_product_use_case import (
    UpdateProductUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_create_category_use_case import (
    ICreateCategoryUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_delete_category_use_case import (
    IDeleteCategoryUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_get_category_use_case import (
    IGetCategoryUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_list_categories_use_case import (
    IListCategoriesUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_update_category_use_case import (
    IUpdateCategoryUseCase,
)
from modules.catalog.domain.interfaces.use_cases.products.i_create_product_use_case import (
    ICreateProductUseCase,
)
from modules.catalog.domain.interfaces.use_cases.products.i_get_product_use_case import (
    IGetProductUseCase,
)
from modules.catalog.domain.interfaces.use_cases.products.i_list_products_use_case import (
    IListProductsUseCase,
)
from modules.catalog.domain.interfaces.use_cases.products.i_set_product_active_use_case import (
    ISetProductActiveUseCase,
)
from modules.catalog.domain.interfaces.use_cases.products.i_update_product_use_case import (
    IUpdateProductUseCase,
)
from modules.catalog.infrastructure.repos.category_repository import CategoryRepository
from modules.catalog.infrastructure.repos.product_repository import ProductRepository
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
from modules.purchases.application.create_purchase_use_case import (
    CreatePurchaseUseCase,
)
from modules.purchases.application.list_purchases_use_case import (
    ListPurchasesUseCase,
)
from modules.purchases.domain.interfaces.use_cases.i_create_purchase_use_case import (
    ICreatePurchaseUseCase,
)
from modules.purchases.domain.interfaces.use_cases.i_list_purchases_use_case import (
    IListPurchasesUseCase,
)
from modules.purchases.infrastructure.repos.purchase_repository import (
    PurchaseRepository,
)
from modules.suppliers.application.add_product_to_supplier_use_case import (
    AddProductToSupplierUseCase,
)
from modules.suppliers.application.create_supplier_use_case import (
    CreateSupplierUseCase,
)
from modules.suppliers.application.download_supplier_product_template_use_case import (
    DownloadSupplierProductTemplateUseCase,
)
from modules.suppliers.application.download_supplier_template_use_case import (
    DownloadSupplierTemplateUseCase,
)
from modules.suppliers.application.get_supplier_use_case import GetSupplierUseCase
from modules.suppliers.application.import_supplier_products_use_case import (
    ImportSupplierProductsUseCase,
)
from modules.suppliers.application.import_suppliers_use_case import (
    ImportSuppliersUseCase,
)
from modules.suppliers.application.list_product_suppliers_use_case import (
    ListProductSuppliersUseCase,
)
from modules.suppliers.application.list_supplier_products_use_case import (
    ListSupplierProductsUseCase,
)
from modules.suppliers.application.list_suppliers_use_case import ListSuppliersUseCase
from modules.suppliers.application.remove_product_from_supplier_use_case import (
    RemoveProductFromSupplierUseCase,
)
from modules.suppliers.application.set_supplier_active_use_case import (
    SetSupplierActiveUseCase,
)
from modules.suppliers.application.update_supplier_product_price_use_case import (
    UpdateSupplierProductPriceUseCase,
)
from modules.suppliers.application.update_supplier_use_case import UpdateSupplierUseCase
from modules.suppliers.domain.interfaces.use_cases.i_add_product_to_supplier_use_case import (
    IAddProductToSupplierUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_create_supplier_use_case import (
    ICreateSupplierUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_download_supplier_product_template_use_case import (
    IDownloadSupplierProductTemplateUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_download_supplier_template_use_case import (
    IDownloadSupplierTemplateUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_get_supplier_use_case import (
    IGetSupplierUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_import_supplier_products_use_case import (
    IImportSupplierProductsUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_import_suppliers_use_case import (
    IImportSuppliersUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_list_product_suppliers_use_case import (
    IListProductSuppliersUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_list_supplier_products_use_case import (
    IListSupplierProductsUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_list_suppliers_use_case import (
    IListSuppliersUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_remove_product_from_supplier_use_case import (
    IRemoveProductFromSupplierUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_set_supplier_active_use_case import (
    ISetSupplierActiveUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_update_supplier_product_price_use_case import (
    IUpdateSupplierProductPriceUseCase,
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


async def get_get_category_use_case(
    db: AsyncSession = Depends(get_db),
) -> IGetCategoryUseCase:
    return GetCategoryUseCase(CategoryRepository(db))


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


async def get_create_product_use_case(
    db: AsyncSession = Depends(get_db),
) -> ICreateProductUseCase:
    return CreateProductUseCase(ProductRepository(db), CategoryRepository(db))


async def get_update_product_use_case(
    db: AsyncSession = Depends(get_db),
) -> IUpdateProductUseCase:
    return UpdateProductUseCase(ProductRepository(db), CategoryRepository(db))


async def get_get_product_use_case(
    db: AsyncSession = Depends(get_db),
) -> IGetProductUseCase:
    return GetProductUseCase(ProductRepository(db))


async def get_list_products_use_case(
    db: AsyncSession = Depends(get_db),
) -> IListProductsUseCase:
    return ListProductsUseCase(ProductRepository(db))


async def get_set_product_active_use_case(
    db: AsyncSession = Depends(get_db),
) -> ISetProductActiveUseCase:
    return SetProductActiveUseCase(ProductRepository(db))


async def get_create_supplier_use_case(
    db: AsyncSession = Depends(get_db),
) -> ICreateSupplierUseCase:
    return CreateSupplierUseCase(SupplierRepository(db))


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


async def get_add_product_to_supplier_use_case(
    db: AsyncSession = Depends(get_db),
) -> IAddProductToSupplierUseCase:
    return AddProductToSupplierUseCase(SupplierRepository(db), ProductRepository(db))


async def get_update_supplier_product_price_use_case(
    db: AsyncSession = Depends(get_db),
) -> IUpdateSupplierProductPriceUseCase:
    return UpdateSupplierProductPriceUseCase(SupplierRepository(db))


async def get_remove_product_from_supplier_use_case(
    db: AsyncSession = Depends(get_db),
) -> IRemoveProductFromSupplierUseCase:
    return RemoveProductFromSupplierUseCase(SupplierRepository(db))


async def get_list_supplier_products_use_case(
    db: AsyncSession = Depends(get_db),
) -> IListSupplierProductsUseCase:
    return ListSupplierProductsUseCase(SupplierRepository(db))


async def get_list_product_suppliers_use_case(
    db: AsyncSession = Depends(get_db),
) -> IListProductSuppliersUseCase:
    return ListProductSuppliersUseCase(SupplierRepository(db))


def get_download_supplier_product_template_use_case() -> (
    IDownloadSupplierProductTemplateUseCase
):
    return DownloadSupplierProductTemplateUseCase()


async def get_import_supplier_products_use_case(
    db: AsyncSession = Depends(get_db),
) -> IImportSupplierProductsUseCase:
    return ImportSupplierProductsUseCase(SupplierRepository(db), ProductRepository(db))


async def get_list_purchases_use_case(
    db: AsyncSession = Depends(get_db),
) -> IListPurchasesUseCase:
    return ListPurchasesUseCase(PurchaseRepository(db))


async def get_create_purchase_use_case(
    db: AsyncSession = Depends(get_db),
) -> ICreatePurchaseUseCase:
    return CreatePurchaseUseCase(
        PurchaseRepository(db),
        SupplierRepository(db),
        ProductRepository(db),
    )
