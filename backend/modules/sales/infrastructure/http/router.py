from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query

from composition.dependencies import (
    get_advance_sale_status_use_case,
    get_create_sale_use_case,
    get_get_sale_use_case,
    get_list_sales_use_case,
)
from composition.security import require_sales_department_or_admin
from modules.sales.domain.interfaces.use_cases.i_advance_sale_status_use_case import (
    IAdvanceSaleStatusUseCase,
)
from modules.sales.domain.interfaces.use_cases.i_create_sale_use_case import (
    ICreateSaleUseCase,
)
from modules.sales.domain.interfaces.use_cases.i_get_sale_use_case import (
    IGetSaleUseCase,
)
from modules.sales.domain.interfaces.use_cases.i_list_sales_use_case import (
    IListSalesUseCase,
)
from modules.sales.domain.sale_status import allowed_next
from modules.sales.infrastructure.http.schemas import (
    ChangeSaleStatusRequest,
    CreateSaleRequest,
    SaleDetailDTO,
    SaleDTO,
)
from shared.domain.dtos.user_session import UserSession
from shared.infrastructure.http.paginated_response import PaginatedResponse

router = APIRouter(prefix="/sales")


@router.post("", response_model=SaleDetailDTO, status_code=201, tags=["Sales"])
async def create_sale(
    body: CreateSaleRequest,
    current_user: UserSession = Depends(require_sales_department_or_admin),
    use_case: ICreateSaleUseCase = Depends(get_create_sale_use_case),
):
    """Create a new sale in Pending status."""
    sale = await use_case.execute(
        client_id=body.client_id,
        warehouse_id=body.warehouse_id,
        user_id=current_user.user_id,
        lines=[line.model_dump() for line in body.lines],
    )
    return SaleDetailDTO.from_entity(sale)


@router.get("", response_model=PaginatedResponse[SaleDTO], tags=["Sales"])
async def list_sales(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    sort_field: Literal[
        "sale_number", "client_name", "status", "sale_date", "total", "created_at"
    ] = Query("created_at", description="Field to sort by"),
    sort_order: Literal["asc", "desc"] = Query("desc", description="Sort direction"),
    status: str | None = Query(
        None, description="Filter by sale status (e.g. Pending)"
    ),
    client_id: int | None = Query(None, description="Filter by client ID"),
    date_from: datetime | None = Query(
        None, description="Filter sales from this date (e.g. 2024-01-01T00:00:00)"
    ),
    date_to: datetime | None = Query(
        None, description="Filter sales up to this date (e.g. 2024-12-31T23:59:59)"
    ),
    search: str | None = Query(
        None, max_length=255, description="Search by sale number or client name"
    ),
    _: UserSession = Depends(require_sales_department_or_admin),
    use_case: IListSalesUseCase = Depends(get_list_sales_use_case),
):
    """Return a paginated list of sales with optional filters."""
    result = await use_case.execute(
        page=page,
        page_size=page_size,
        sort_field=sort_field,
        sort_order=sort_order,
        status=status,
        client_id=client_id,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )
    return PaginatedResponse(
        items=[
            SaleDTO(
                sale_id=sale.sale_id,
                sale_number=sale.sale_number,
                client_id=sale.client_id,
                warehouse_id=sale.warehouse_id,
                client_name=client_name,
                status=sale.status,
                allowed_transitions=allowed_next(sale.status),
                sale_date=sale.sale_date,
                total=sale.total,
            )
            for sale, client_name in result.items
        ],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


@router.get("/{sale_id}", response_model=SaleDetailDTO, tags=["Sales"])
async def get_sale(
    sale_id: int,
    _: UserSession = Depends(require_sales_department_or_admin),
    use_case: IGetSaleUseCase = Depends(get_get_sale_use_case),
):
    """Return the full detail of a single sale."""
    sale = await use_case.execute(sale_id)
    return SaleDetailDTO.from_entity(sale)


@router.patch("/{sale_id}/status", response_model=SaleDetailDTO, tags=["Sales"])
async def change_sale_status(
    sale_id: int,
    body: ChangeSaleStatusRequest,
    current_user: UserSession = Depends(require_sales_department_or_admin),
    use_case: IAdvanceSaleStatusUseCase = Depends(get_advance_sale_status_use_case),
):
    """Advance a sale to the next status in the lifecycle."""
    sale = await use_case.execute(
        sale_id=sale_id,
        new_status=body.new_status,
        actor=current_user,
    )
    return SaleDetailDTO.from_entity(sale)
