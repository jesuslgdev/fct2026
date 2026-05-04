from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query, Response

from composition.dependencies import (
    get_adjust_stock_use_case,
    get_create_warehouse_use_case,
    get_delete_warehouse_use_case,
    get_get_product_stock_overview_use_case,
    get_get_stock_movement_use_case,
    get_get_warehouse_use_case,
    get_list_stock_distribution_use_case,
    get_list_stock_movements_use_case,
    get_list_warehouses_use_case,
    get_update_warehouse_use_case,
)
from composition.security import get_current_user, require_admin
from modules.warehouse.domain.interfaces.use_cases.i_adjust_stock_use_case import (
    IAdjustStockUseCase,
)
from modules.warehouse.domain.interfaces.use_cases.i_create_warehouse_use_case import (
    ICreateWarehouseUseCase,
)
from modules.warehouse.domain.interfaces.use_cases.i_delete_warehouse_use_case import (
    IDeleteWarehouseUseCase,
)
from modules.warehouse.domain.interfaces.use_cases.i_get_product_stock_overview_use_case import (
    IGetProductStockOverviewUseCase,
)
from modules.warehouse.domain.interfaces.use_cases.i_get_stock_movement_use_case import (
    IGetStockMovementUseCase,
)
from modules.warehouse.domain.interfaces.use_cases.i_get_warehouse_use_case import (
    IGetWarehouseUseCase,
)
from modules.warehouse.domain.interfaces.use_cases.i_list_stock_distribution_use_case import (
    IListStockDistributionUseCase,
)
from modules.warehouse.domain.interfaces.use_cases.i_list_stock_movements_use_case import (
    IListStockMovementsUseCase,
)
from modules.warehouse.domain.interfaces.use_cases.i_list_warehouses_use_case import (
    IListWarehousesUseCase,
)
from modules.warehouse.domain.interfaces.use_cases.i_update_warehouse_use_case import (
    IUpdateWarehouseUseCase,
)
from modules.warehouse.infrastructure.http.schemas import (
    AddressDTO,
    AdjustStockDTO,
    AdjustStockResponseDTO,
    CreateWarehouseDTO,
    ProductStockOverviewDTO,
    StockDistributionItemDTO,
    StockMovementDetailDTO,
    StockMovementItemDTO,
    UpdateWarehouseDTO,
    WarehouseDTO,
    WarehouseStockDetailDTO,
)
from shared.domain.dtos.address import Address
from shared.domain.dtos.user_session import UserSession
from shared.infrastructure.http.paginated_response import PaginatedResponse

router = APIRouter(prefix="/warehouse", tags=["Warehouse - Stock"])


def _to_address_dto(address_data: Address) -> AddressDTO:
    return AddressDTO(
        street=address_data.street,
        city=address_data.city,
        province=address_data.province,
        postal_code=address_data.postal_code,
    )


@router.get(
    "/products/{product_id}/stock",
    response_model=ProductStockOverviewDTO,
)
async def get_product_stock_overview(
    product_id: int,
    use_case: IGetProductStockOverviewUseCase = Depends(
        get_get_product_stock_overview_use_case
    ),
    _: dict = Depends(get_current_user),
):
    """Return the stock overview for a product across all warehouses."""
    result = await use_case.execute(product_id)
    return ProductStockOverviewDTO(
        product_id=result.product_id,
        product_code=result.product_code,
        product_name=result.product_name,
        stock_global=result.stock_global,
        stock_min=result.stock_min,
        alert_level=result.alert_level,
        warehouses=[
            WarehouseStockDetailDTO(
                warehouse_id=w.warehouse_id,
                warehouse_name=w.warehouse_name,
                stock=w.stock,
                reserved_stock=w.reserved_stock,
                available_stock=w.available_stock,
            )
            for w in result.warehouses
        ],
    )


# ── Warehouse Management ─────────────────────────────────────────


@router.get("/warehouses", response_model=list[WarehouseDTO])
async def list_warehouses(
    use_case: IListWarehousesUseCase = Depends(get_list_warehouses_use_case),
    _: dict = Depends(get_current_user),
):
    """Return all warehouses with their total stock."""
    results = await use_case.execute()
    return [
        WarehouseDTO(
            warehouse_id=r.warehouse_id,
            name=r.name,
            address=_to_address_dto(r.address),
            total_stock=r.total_stock,
        )
        for r in results
    ]


@router.get("/warehouses/{warehouse_id}", response_model=WarehouseDTO)
async def get_warehouse(
    warehouse_id: int,
    use_case: IGetWarehouseUseCase = Depends(get_get_warehouse_use_case),
    _: dict = Depends(get_current_user),
):
    """Return a single warehouse with its total stock."""
    result = await use_case.execute(warehouse_id)
    return WarehouseDTO(
        warehouse_id=result.warehouse_id,
        name=result.name,
        address=_to_address_dto(result.address),
        total_stock=result.total_stock,
    )


@router.post("/warehouses", response_model=WarehouseDTO, status_code=201)
async def create_warehouse(
    body: CreateWarehouseDTO,
    use_case: ICreateWarehouseUseCase = Depends(get_create_warehouse_use_case),
    _: dict = Depends(require_admin),
):
    """Create a new warehouse."""
    result = await use_case.execute(
        body.name,
        Address(
            street=body.address.street,
            city=body.address.city,
            province=body.address.province,
            postal_code=body.address.postal_code,
        ),
    )
    return WarehouseDTO(
        warehouse_id=result.warehouse_id,
        name=result.name,
        address=_to_address_dto(result.address_data),
        total_stock=0,
    )


@router.put("/warehouses/{warehouse_id}", response_model=WarehouseDTO)
async def update_warehouse(
    warehouse_id: int,
    body: UpdateWarehouseDTO,
    use_case: IUpdateWarehouseUseCase = Depends(get_update_warehouse_use_case),
    _: dict = Depends(require_admin),
):
    """Update an existing warehouse."""
    result = await use_case.execute(
        warehouse_id,
        body.name,
        Address(
            street=body.address.street,
            city=body.address.city,
            province=body.address.province,
            postal_code=body.address.postal_code,
        ),
    )
    return WarehouseDTO(
        warehouse_id=result.warehouse_id,
        name=result.name,
        address=_to_address_dto(result.address_data),
        total_stock=0,
    )


@router.delete("/warehouses/{warehouse_id}", status_code=204)
async def delete_warehouse(
    warehouse_id: int,
    use_case: IDeleteWarehouseUseCase = Depends(get_delete_warehouse_use_case),
    _: dict = Depends(require_admin),
):
    """Delete a warehouse if it has no stock."""
    await use_case.execute(warehouse_id)
    return Response(status_code=204)


# ── Stock Distribution, Movement History & Adjustment ───────────


@router.get("/stock", response_model=PaginatedResponse[StockDistributionItemDTO])
async def list_stock_distribution(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    warehouse_id: int | None = Query(None, description="Filter by warehouse ID"),
    product_id: int | None = Query(None, description="Filter by product ID"),
    search: str | None = Query(None, description="Search by product name"),
    use_case: IListStockDistributionUseCase = Depends(
        get_list_stock_distribution_use_case
    ),
    _: dict = Depends(get_current_user),
):
    """Return paginated stock distribution across warehouses and products."""
    result = await use_case.execute(page, page_size, warehouse_id, product_id, search)
    return PaginatedResponse(
        items=[
            StockDistributionItemDTO(
                warehouse_id=item.warehouse_id,
                warehouse_name=item.warehouse_name,
                product_id=item.product_id,
                product_code=item.product_code,
                product_name=item.product_name,
                stock=item.stock,
                reserved_stock=item.reserved_stock,
                available_stock=item.available_stock,
            )
            for item in result.items
        ],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


@router.get("/stock/movements", response_model=PaginatedResponse[StockMovementItemDTO])
async def list_stock_movements(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    product_id: int | None = Query(None, description="Filter by product ID"),
    movement_type: Literal["inbound", "outbound", "adjustment"] | None = Query(
        None, description="Filter by movement type"
    ),
    date_from: datetime | None = Query(
        None, description="Filter movements from this date (ISO 8601)"
    ),
    date_to: datetime | None = Query(
        None, description="Filter movements up to this date (ISO 8601)"
    ),
    reason_search: str | None = Query(
        None, description="Case-insensitive search on reason/reference"
    ),
    use_case: IListStockMovementsUseCase = Depends(get_list_stock_movements_use_case),
    _: dict = Depends(get_current_user),
):
    """Return paginated stock movement history with optional filters."""
    result = await use_case.execute(
        page=page,
        page_size=page_size,
        product_id=product_id,
        movement_type=movement_type,
        date_from=date_from,
        date_to=date_to,
        reason_search=reason_search,
    )
    return PaginatedResponse(
        items=[
            StockMovementItemDTO(
                movement_id=item.movement_id,
                product_id=item.product_id,
                product_name=item.product_name,
                movement_type=item.movement_type,
                difference=item.difference,
                reason=item.reason,
                created_at=item.created_at,
            )
            for item in result.items
        ],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


@router.get("/stock/movements/{movement_id}", response_model=StockMovementDetailDTO)
async def get_stock_movement(
    movement_id: int,
    use_case: IGetStockMovementUseCase = Depends(get_get_stock_movement_use_case),
    _: dict = Depends(get_current_user),
):
    """Return the full detail of a single stock movement."""
    result = await use_case.execute(movement_id)
    return StockMovementDetailDTO(
        movement_id=result.movement_id,
        warehouse_id=result.warehouse_id,
        product_id=result.product_id,
        product_name=result.product_name,
        movement_type=result.movement_type,
        previous_quantity=result.previous_quantity,
        new_quantity=result.new_quantity,
        difference=result.difference,
        reason=result.reason,
        user_email=result.user_email,
        created_at=result.created_at,
    )


@router.post("/stock/adjust", response_model=AdjustStockResponseDTO)
async def adjust_stock(
    body: AdjustStockDTO,
    use_case: IAdjustStockUseCase = Depends(get_adjust_stock_use_case),
    current_user: UserSession = Depends(get_current_user),
):
    """Adjust stock for a product in a specific warehouse."""
    result = await use_case.execute(
        warehouse_id=body.warehouse_id,
        product_id=body.product_id,
        new_quantity=body.new_quantity,
        user_email=current_user.email,
        reason=body.reason,
    )
    return AdjustStockResponseDTO(
        movement_id=result.movement_id,
        warehouse_id=result.warehouse_id,
        product_id=result.product_id,
        previous_quantity=result.previous_quantity,
        new_quantity=result.new_quantity,
        difference=result.difference,
        global_stock=result.global_stock,
        created_at=result.created_at,
    )
