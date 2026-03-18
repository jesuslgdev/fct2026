from pydantic import BaseModel, Field


class CreateWarehouseDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    address: str = Field(..., min_length=1, max_length=255)


class UpdateWarehouseDTO(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    address: str = Field(..., min_length=1, max_length=255)


class WarehouseDTO(BaseModel):
    warehouse_id: int
    name: str
    address: str
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
