from pydantic import BaseModel


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
