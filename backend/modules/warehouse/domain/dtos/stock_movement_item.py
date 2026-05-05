from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class StockMovementItem:
    """A single row in the stock movement history list.

    Attributes:
        movement_id: Primary key of the movement record.
        product_id: Product primary key.
        product_name: Product display name (joined from products table).
        movement_type: Kind of movement: inbound, outbound, or adjustment.
        difference: Net quantity change (positive = stock in, negative = stock out).
        reason: Optional free-text reference (e.g. purchase number, sale number).
        purchase_id: Originating purchase ID, if the movement came from a purchase.
        sale_id: Originating sale ID, if the movement came from a sale.
        created_at: Timestamp of the movement.
    """

    movement_id: int
    product_id: int
    product_name: str
    movement_type: str
    difference: int
    reason: str | None
    purchase_id: int | None
    sale_id: int | None
    created_at: datetime
