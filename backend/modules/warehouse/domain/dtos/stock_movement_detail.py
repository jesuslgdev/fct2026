from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class StockMovementDetail:
    """Full detail of a single stock movement record.

    Attributes:
        movement_id: Primary key.
        warehouse_id: Warehouse where the movement occurred.
        warehouse_name: Display name of the warehouse.
        product_id: Product primary key.
        product_name: Product display name.
        movement_type: Kind of movement: inbound, outbound, or adjustment.
        previous_quantity: Stock before the movement.
        new_quantity: Stock after the movement.
        difference: Net quantity change.
        reason: Optional free-text reference (e.g. purchase or sale number).
        purchase_id: Originating purchase ID, if any.
        sale_id: Originating sale ID, if any.
        user_email: Email of the user who triggered the movement.
        created_at: Timestamp of the movement.
    """

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
