from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class AdjustStockResult:
    """Response data for a stock adjustment operation.

    Attributes:
        movement_id: Primary key of the created StockMovement.
        warehouse_id: Warehouse where stock was adjusted.
        product_id: Product whose stock was adjusted.
        previous_quantity: Stock before the adjustment.
        new_quantity: Stock after the adjustment.
        difference: new_quantity - previous_quantity.
        global_stock: Updated total stock across all warehouses for the product.
        created_at: Timestamp of the movement.
    """

    movement_id: int
    warehouse_id: int
    product_id: int
    previous_quantity: int
    new_quantity: int
    difference: int
    global_stock: int
    created_at: datetime
