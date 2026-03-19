from fastapi import APIRouter, Depends, Query, Response

from composition.dependencies import (
    get_adjust_stock_use_case,
    get_create_warehouse_use_case,
    get_delete_warehouse_use_case,
    get_get_product_stock_overview_use_case,
    get_get_warehouse_use_case,
    get_list_stock_distribution_use_case,
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
from modules.warehouse.domain.interfaces.use_cases.i_get_warehouse_use_case import (
    IGetWarehouseUseCase,
)
from modules.warehouse.domain.interfaces.use_cases.i_list_stock_distribution_use_case import (
    IListStockDistributionUseCase,
)
from modules.warehouse.domain.interfaces.use_cases.i_list_warehouses_use_case import (
    IListWarehousesUseCase,
)
from modules.warehouse.domain.interfaces.use_cases.i_update_warehouse_use_case import (
    IUpdateWarehouseUseCase,
)
from modules.warehouse.infrastructure.http.schemas import (
    AdjustStockDTO,
    AdjustStockResponseDTO,
    CreateWarehouseDTO,
    ProductStockOverviewDTO,
    StockDistributionItemDTO,
    StockDistributionPageDTO,
    UpdateWarehouseDTO,
    WarehouseDTO,
    WarehouseStockDetailDTO,
)

router = APIRouter(prefix="/warehouse", tags=["Warehouse - Stock"])


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
            address=r.address,
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
        address=result.address,
        total_stock=result.total_stock,
    )


@router.post("/warehouses", response_model=WarehouseDTO, status_code=201)
async def create_warehouse(
    body: CreateWarehouseDTO,
    use_case: ICreateWarehouseUseCase = Depends(get_create_warehouse_use_case),
    _: dict = Depends(require_admin),
):
    """Create a new warehouse."""
    result = await use_case.execute(body.name, body.address)
    return WarehouseDTO(
        warehouse_id=result.warehouse_id,
        name=result.name,
        address=result.address,
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
    result = await use_case.execute(warehouse_id, body.name, body.address)
    return WarehouseDTO(
        warehouse_id=result.warehouse_id,
        name=result.name,
        address=result.address,
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


# ── Stock Distribution & Adjustment ─────────────────────────────


@router.get("/stock", response_model=StockDistributionPageDTO)
async def list_stock_distribution(
    warehouse_id: int | None = Query(None),
    product_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    use_case: IListStockDistributionUseCase = Depends(
        get_list_stock_distribution_use_case
    ),
    _: dict = Depends(get_current_user),
):
    """Return paginated stock distribution across warehouses and products."""
    result = await use_case.execute(
        warehouse_id=warehouse_id,
        product_id=product_id,
        page=page,
        page_size=page_size,
    )
    return StockDistributionPageDTO(
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
        total_count=result.total_count,
        page=result.page,
        page_size=result.page_size,
    )


@router.post("/stock/adjust", response_model=AdjustStockResponseDTO)
async def adjust_stock(
    body: AdjustStockDTO,
    use_case: IAdjustStockUseCase = Depends(get_adjust_stock_use_case),
    current_user: dict = Depends(get_current_user),
):
    """Adjust stock for a product in a specific warehouse."""
    result = await use_case.execute(
        warehouse_id=body.warehouse_id,
        product_id=body.product_id,
        new_quantity=body.new_quantity,
        user_email=current_user["email"],
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
