from io import BytesIO

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile
from fastapi.responses import StreamingResponse

from composition.dependencies import (
    get_add_product_to_supplier_use_case,
    get_create_supplier_use_case,
    get_download_supplier_template_use_case,
    get_get_supplier_use_case,
    get_import_suppliers_use_case,
    get_list_supplier_products_use_case,
    get_list_suppliers_use_case,
    get_remove_product_from_supplier_use_case,
    get_set_supplier_active_use_case,
    get_update_supplier_product_price_use_case,
    get_update_supplier_use_case,
)
from composition.security import get_current_user, require_purchases_manager_or_admin
from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.entities.supplier_product import SupplierProduct
from modules.suppliers.domain.entities.supplier_product_detail import (
    SupplierProductDetail,
)
from modules.suppliers.domain.interfaces.use_cases.i_add_product_to_supplier_use_case import (
    IAddProductToSupplierUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_create_supplier_use_case import (
    ICreateSupplierUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_download_supplier_template_use_case import (
    IDownloadSupplierTemplateUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_get_supplier_use_case import (
    IGetSupplierUseCase,
)
from modules.suppliers.domain.interfaces.use_cases.i_import_suppliers_use_case import (
    IImportSuppliersUseCase,
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
from modules.suppliers.infrastructure.http.schemas import (
    AddSupplierProductRequest,
    CreateSupplierDTO,
    ImportErrorDTO,
    ImportResultDTO,
    SetSupplierActiveDTO,
    SupplierDetailDTO,
    SupplierDTO,
    SupplierProductDTO,
    UpdateSupplierDTO,
    UpdateSupplierProductPriceRequest,
)
from shared.domain.entities.user_session import UserSession
from shared.infrastructure.http.paginated_response import PaginatedResponse

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


def _to_supplier_dto(supplier: Supplier) -> SupplierDTO:
    return SupplierDTO(
        supplier_id=supplier.supplier_id,
        name=supplier.name,
        tax_id=supplier.tax_id,
        city=supplier.city,
        is_active=supplier.is_active,
    )


def _to_supplier_product_dto(detail: SupplierProductDetail) -> SupplierProductDTO:
    return SupplierProductDTO(
        product_id=detail.product_id,
        product_name=detail.product_name,
        product_code=detail.product_code,
        category_name=detail.category_name,
        supplier_price=detail.supplier_price,
    )


def _to_supplier_detail_dto(
    supplier: Supplier, products: list[SupplierProductDetail]
) -> SupplierDetailDTO:
    return SupplierDetailDTO(
        supplier_id=supplier.supplier_id,
        name=supplier.name,
        tax_id=supplier.tax_id,
        city=supplier.city,
        is_active=supplier.is_active,
        address=supplier.address,
        province=supplier.province,
        postal_code=supplier.postal_code,
        phone=supplier.phone,
        email=supplier.email,
        products=[_to_supplier_product_dto(p) for p in products],
    )


@router.get("/template")
def download_template(
    _: UserSession = Depends(require_purchases_manager_or_admin),
    use_case: IDownloadSupplierTemplateUseCase = Depends(
        get_download_supplier_template_use_case
    ),
):
    content = use_case.execute()
    return StreamingResponse(
        BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=suppliers_template.xlsx"},
    )


@router.post("/import", response_model=ImportResultDTO)
async def import_suppliers(
    file: UploadFile = File(...),
    _: UserSession = Depends(require_purchases_manager_or_admin),
    use_case: IImportSuppliersUseCase = Depends(get_import_suppliers_use_case),
):
    content = await file.read()
    result = await use_case.execute(content)
    return ImportResultDTO(
        total=result.total,
        created=result.created,
        errors=len(result.errors),
        error_detail=[
            ImportErrorDTO(row=e.row, reason=e.reason) for e in result.errors
        ],
    )


@router.post("", response_model=SupplierDetailDTO, status_code=201)
async def create_supplier(
    body: CreateSupplierDTO,
    _: UserSession = Depends(require_purchases_manager_or_admin),
    use_case: ICreateSupplierUseCase = Depends(get_create_supplier_use_case),
):
    result = await use_case.execute(
        name=body.name,
        tax_id=body.tax_id,
        address=body.address,
        city=body.city,
        province=body.province,
        postal_code=body.postal_code,
        phone=body.phone,
        email=body.email,
    )
    return _to_supplier_detail_dto(result, [])


@router.get("", response_model=PaginatedResponse[SupplierDTO])
async def list_suppliers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, max_length=255),
    active: bool | None = Query(None),
    _: UserSession = Depends(get_current_user),
    use_case: IListSuppliersUseCase = Depends(get_list_suppliers_use_case),
):
    result = await use_case.execute(page, page_size, search=search, active=active)
    return PaginatedResponse(
        items=[_to_supplier_dto(s) for s in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


@router.get("/{supplier_id}", response_model=SupplierDetailDTO)
async def get_supplier(
    supplier_id: int,
    _: UserSession = Depends(get_current_user),
    use_case: IGetSupplierUseCase = Depends(get_get_supplier_use_case),
):
    supplier, products = await use_case.execute(supplier_id)
    return _to_supplier_detail_dto(supplier, products)


@router.put("/{supplier_id}", response_model=SupplierDTO)
async def update_supplier(
    supplier_id: int,
    body: UpdateSupplierDTO,
    _: UserSession = Depends(require_purchases_manager_or_admin),
    use_case: IUpdateSupplierUseCase = Depends(get_update_supplier_use_case),
):
    result = await use_case.execute(
        supplier_id,
        body.name,
        body.address,
        body.city,
        body.province,
        body.postal_code,
        body.phone,
        body.email,
    )
    return _to_supplier_dto(result)


@router.patch("/{supplier_id}/active", status_code=204)
async def set_supplier_active(
    supplier_id: int,
    body: SetSupplierActiveDTO,
    _: UserSession = Depends(require_purchases_manager_or_admin),
    use_case: ISetSupplierActiveUseCase = Depends(get_set_supplier_active_use_case),
):
    await use_case.execute(supplier_id, body.is_active)
    return Response(status_code=204)


@router.post(
    "/{supplier_id}/products", status_code=201, response_model=SupplierProductDTO
)
async def add_product_to_supplier(
    supplier_id: int,
    body: AddSupplierProductRequest,
    _: UserSession = Depends(require_purchases_manager_or_admin),
    use_case: IAddProductToSupplierUseCase = Depends(
        get_add_product_to_supplier_use_case
    ),
):
    result = await use_case.execute(supplier_id, body.product_id, body.supplier_price)
    return SupplierProductDTO(
        product_id=result.product_id,
        supplier_price=result.supplier_price,
    )


@router.get(
    "/{supplier_id}/products", response_model=PaginatedResponse[SupplierProductDTO]
)
async def list_supplier_products(
    supplier_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    _: UserSession = Depends(get_current_user),
    use_case: IListSupplierProductsUseCase = Depends(
        get_list_supplier_products_use_case
    ),
):
    result = await use_case.execute(supplier_id, page, page_size)
    return PaginatedResponse(
        items=[_to_supplier_product_dto(p) for p in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


@router.put("/{supplier_id}/products/{product_id}", response_model=SupplierProductDTO)
async def update_supplier_product_price(
    supplier_id: int,
    product_id: int,
    body: UpdateSupplierProductPriceRequest,
    _: UserSession = Depends(require_purchases_manager_or_admin),
    use_case: IUpdateSupplierProductPriceUseCase = Depends(
        get_update_supplier_product_price_use_case
    ),
):
    result = await use_case.execute(supplier_id, product_id, body.supplier_price)
    return SupplierProductDTO(
        product_id=result.product_id,
        supplier_price=result.supplier_price,
    )


@router.delete("/{supplier_id}/products/{product_id}", status_code=204)
async def remove_product_from_supplier(
    supplier_id: int,
    product_id: int,
    _: UserSession = Depends(require_purchases_manager_or_admin),
    use_case: IRemoveProductFromSupplierUseCase = Depends(
        get_remove_product_from_supplier_use_case
    ),
):
    await use_case.execute(supplier_id, product_id)
    return Response(status_code=204)
