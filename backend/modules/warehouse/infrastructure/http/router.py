from fastapi import APIRouter, Depends

from composition.dependencies import get_get_product_stock_overview_use_case
from composition.security import get_current_user
from modules.warehouse.domain.interfaces.use_cases.i_get_product_stock_overview_use_case import (
    IGetProductStockOverviewUseCase,
)
from modules.warehouse.infrastructure.http.schemas import (
    ProductStockOverviewDTO,
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
