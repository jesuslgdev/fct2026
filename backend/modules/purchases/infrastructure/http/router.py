from datetime import datetime

from fastapi import APIRouter, Depends, Query

from composition.dependencies import (
    get_add_purchase_line_use_case,
    get_create_purchase_use_case,
    get_delete_purchase_line_use_case,
    get_get_supplier_price_use_case,
    get_list_purchases_use_case,
    get_update_purchase_line_use_case,
)
from composition.security import (
    get_current_user,
    require_purchases_department_or_admin,
)
from modules.purchases.domain.interfaces.use_cases.i_add_purchase_line_use_case import (
    IAddPurchaseLineUseCase,
)
from modules.purchases.domain.interfaces.use_cases.i_create_purchase_use_case import (
    ICreatePurchaseUseCase,
)
from modules.purchases.domain.interfaces.use_cases.i_delete_purchase_line_use_case import (
    IDeletePurchaseLineUseCase,
)
from modules.purchases.domain.interfaces.use_cases.i_get_supplier_price_use_case import (
    IGetSupplierPriceUseCase,
)
from modules.purchases.domain.interfaces.use_cases.i_list_purchases_use_case import (
    IListPurchasesUseCase,
)
from modules.purchases.domain.interfaces.use_cases.i_update_purchase_line_use_case import (
    IUpdatePurchaseLineUseCase,
)
from modules.purchases.infrastructure.http.schemas import (
    AddPurchaseLineRequest,
    CreatePurchaseRequest,
    PurchaseDetailDTO,
    PurchaseDTO,
    PurchaseLineDTO,
    SupplierPriceDTO,
    UpdatePurchaseLineRequest,
)
from shared.domain.entities.user_session import UserSession
from shared.infrastructure.http.paginated_response import PaginatedResponse

router = APIRouter(prefix="/purchases", tags=["Purchases"])


def _purchase_detail(purchase) -> PurchaseDetailDTO:
    return PurchaseDetailDTO(
        purchase_id=purchase.purchase_id,
        purchase_number=purchase.purchase_number,
        supplier_id=purchase.supplier_id,
        user_id=purchase.user_id,
        warehouse_id=purchase.warehouse_id,
        purchase_date=purchase.purchase_date,
        status=purchase.status,
        subtotal=purchase.subtotal,
        taxes=purchase.taxes,
        total=purchase.total,
        created_at=purchase.created_at,
        updated_at=purchase.updated_at,
        lines=[
            PurchaseLineDTO(
                purchase_line_id=line.purchase_line_id,
                purchase_id=line.purchase_id,
                product_id=line.product_id,
                quantity=line.quantity,
                unit_price=line.unit_price,
                discount=line.discount,
                line_subtotal=line.line_subtotal,
            )
            for line in purchase.lines
        ],
    )


@router.get("", response_model=PaginatedResponse[PurchaseDTO])
async def list_purchases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_field: str = Query("created_at"),
    sort_order: str = Query("desc"),
    status: str | None = Query(None),
    supplier_id: int | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    search: str | None = Query(None, max_length=255),
    _: UserSession = Depends(get_current_user),
    use_case: IListPurchasesUseCase = Depends(get_list_purchases_use_case),
):
    result = await use_case.execute(
        page=page,
        page_size=page_size,
        sort_field=sort_field,
        sort_order=sort_order,
        status=status,
        supplier_id=supplier_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )
    return PaginatedResponse(
        items=[
            PurchaseDTO(
                purchase_id=purchase.purchase_id,
                purchase_number=purchase.purchase_number,
                supplier_name=supplier_name,
                status=purchase.status,
                warehouse_id=purchase.warehouse_id,
                created_at=purchase.created_at,
                total=purchase.total,
            )
            for purchase, supplier_name in result.items
        ],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


@router.post("", response_model=PurchaseDetailDTO, status_code=201)
async def create_purchase(
    body: CreatePurchaseRequest,
    current_user: UserSession = Depends(require_purchases_department_or_admin),
    use_case: ICreatePurchaseUseCase = Depends(get_create_purchase_use_case),
):
    purchase = await use_case.execute(
        supplier_id=body.supplier_id,
        user_id=current_user.user_id,
        warehouse_id=body.warehouse_id,
        lines=[line.model_dump() for line in body.lines],
    )
    return _purchase_detail(purchase)


@router.post("/{purchase_id}/lines", response_model=PurchaseDetailDTO, status_code=201)
async def add_purchase_line(
    purchase_id: int,
    body: AddPurchaseLineRequest,
    _: UserSession = Depends(require_purchases_department_or_admin),
    use_case: IAddPurchaseLineUseCase = Depends(get_add_purchase_line_use_case),
):
    purchase = await use_case.execute(
        purchase_id=purchase_id,
        product_id=body.product_id,
        quantity=body.quantity,
        unit_price=body.unit_price,
        discount=body.discount,
    )
    return _purchase_detail(purchase)


@router.put("/{purchase_id}/lines/{line_id}", response_model=PurchaseDetailDTO)
async def update_purchase_line(
    purchase_id: int,
    line_id: int,
    body: UpdatePurchaseLineRequest,
    _: UserSession = Depends(require_purchases_department_or_admin),
    use_case: IUpdatePurchaseLineUseCase = Depends(get_update_purchase_line_use_case),
):
    purchase = await use_case.execute(
        purchase_id=purchase_id,
        purchase_line_id=line_id,
        quantity=body.quantity,
        unit_price=body.unit_price,
        discount=body.discount,
    )
    return _purchase_detail(purchase)


@router.delete("/{purchase_id}/lines/{line_id}", response_model=PurchaseDetailDTO)
async def delete_purchase_line(
    purchase_id: int,
    line_id: int,
    _: UserSession = Depends(require_purchases_department_or_admin),
    use_case: IDeletePurchaseLineUseCase = Depends(get_delete_purchase_line_use_case),
):
    purchase = await use_case.execute(
        purchase_id=purchase_id,
        purchase_line_id=line_id,
    )
    return _purchase_detail(purchase)


@router.get(
    "/{purchase_id}/supplier-prices/{product_id}",
    response_model=SupplierPriceDTO,
)
async def get_supplier_price(
    purchase_id: int,
    product_id: int,
    _: UserSession = Depends(get_current_user),
    use_case: IGetSupplierPriceUseCase = Depends(get_get_supplier_price_use_case),
):
    return await use_case.execute(
        purchase_id=purchase_id,
        product_id=product_id,
    )
