from datetime import datetime

from fastapi import APIRouter, Depends, Query

from composition.dependencies import get_list_purchases_use_case
from composition.security import get_current_user
from modules.purchases.domain.interfaces.use_cases.i_list_purchases_use_case import (
    IListPurchasesUseCase,
)
from modules.purchases.infrastructure.http.schemas import PurchaseDTO
from shared.domain.entities.user_session import UserSession
from shared.infrastructure.http.paginated_response import PaginatedResponse

router = APIRouter(prefix="/purchases", tags=["Purchases"])


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
