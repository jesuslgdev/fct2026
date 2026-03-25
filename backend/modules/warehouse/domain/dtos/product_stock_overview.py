from dataclasses import dataclass


@dataclass(frozen=True)
class WarehouseStockDetail:
    """Stock held in a single warehouse for a given product.

    Attributes:
        warehouse_id: Warehouse primary key.
        warehouse_name: Human-readable warehouse name.
        stock: Total physical units in this warehouse.
        reserved_stock: Units committed by active sales.
        available_stock: Units available for new sales.
    """

    warehouse_id: int
    warehouse_name: str
    stock: int
    reserved_stock: int
    available_stock: int


@dataclass(frozen=True)
class ProductStockOverview:
    """Aggregated stock view for a product across all warehouses.

    Attributes:
        product_id: Product primary key.
        product_code: Unique SKU.
        product_name: Product display name.
        stock_global: Total stock summed across all warehouses.
        stock_min: Minimum stock threshold from the product configuration.
        alert_level: "critical" (stock == 0), "warning" (0 < stock < min),
                     or "ok" (stock >= min).
        warehouses: Per-warehouse stock breakdown.
    """

    product_id: int
    product_code: str
    product_name: str
    stock_global: int
    stock_min: int
    alert_level: str
    warehouses: list[WarehouseStockDetail]
