from datetime import datetime

from pydantic import BaseModel, Field

from shared.constants import POSTAL_CODE_PATTERN


class AddressDTO(BaseModel):
    street: str = Field(..., min_length=1, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    province: str = Field(..., min_length=1, max_length=100)
    postal_code: str = Field(..., pattern=POSTAL_CODE_PATTERN)


class CreateWarehouseDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    address: AddressDTO


class UpdateWarehouseDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    address: AddressDTO


class WarehouseDTO(BaseModel):
    warehouse_id: int
    name: str
    address: AddressDTO
    total_stock: int


class WarehouseStockDetailDTO(BaseModel):
    """Stock held in a single warehouse for a given product."""

    warehouse_id: int
    warehouse_name: str
    stock: int
    reserved_stock: int
    available_stock: int


class ProductStockOverviewDTO(BaseModel):
    """Aggregated stock view for a product across all warehouses."""

    product_id: int
    product_code: str
    product_name: str
    stock_global: int
    stock_min: int
    alert_level: str
    warehouses: list[WarehouseStockDetailDTO]


# ── Stock Distribution ──────────────────────────────────────────


class StockDistributionItemDTO(BaseModel):
    """Single row in the stock distribution grid."""

    warehouse_id: int
    warehouse_name: str
    product_id: int
    product_code: str
    product_name: str
    stock: int
    reserved_stock: int
    available_stock: int


# ── Stock Movement History ──────────────────────────────────────


class StockMovementItemDTO(BaseModel):
    """Single row in the stock movement history list."""

    movement_id: int
    product_id: int
    product_name: str
    movement_type: str
    difference: int
    reason: str | None
    purchase_id: int | None
    sale_id: int | None
    created_at: datetime


class StockMovementDetailDTO(BaseModel):
    """Full detail of a single stock movement."""

    movement_id: int
    warehouse_id: int
    warehouse_name: str
    product_id: int
    product_name: str
    movement_type: str
    previous_quantity: int
    new_quantity: int
    difference: int
    reason: str | None
    purchase_id: int | None
    sale_id: int | None
    user_email: str
    created_at: datetime


# ── Stock Adjustment ────────────────────────────────────────────


class AdjustStockDTO(BaseModel):
    """Request body to adjust stock in a warehouse."""

    warehouse_id: int
    product_id: int
    new_quantity: int = Field(..., ge=0)
    reason: str | None = Field(None, max_length=300)


class AdjustStockResponseDTO(BaseModel):
    """Response after a successful stock adjustment."""

    movement_id: int
    warehouse_id: int
    product_id: int
    previous_quantity: int
    new_quantity: int
    difference: int
    global_stock: int
    created_at: datetime
