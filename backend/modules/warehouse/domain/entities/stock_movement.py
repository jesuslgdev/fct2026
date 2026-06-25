from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.database.base_model import Base


class StockMovement(Base):
    """ORM entity for the stock_movements table.

    Records every inventory adjustment so that changes are fully auditable.

    Attributes:
        movement_id: Primary key.
        warehouse_id: Foreign key to the warehouses table.
        product_id: Foreign key to the products table.
        movement_type: Kind of movement (e.g. "adjustment").
        previous_quantity: Stock before the adjustment.
        new_quantity: Stock after the adjustment.
        difference: new_quantity - previous_quantity.
        reason: Optional free-text justification (max 300 chars).
        purchase_id: Optional FK to the originating purchase, if any.
        sale_id: Optional FK to the originating sale, if any.
        user_email: Email of the user who performed the adjustment.
        created_at: Timestamp of the movement, set by the database.
    """

    __tablename__ = "stock_movements"

    movement_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    warehouse_id: Mapped[int] = mapped_column(
        ForeignKey("warehouses.warehouse_id"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.product_id"), nullable=False
    )
    movement_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="adjustment"
    )
    previous_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    new_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    difference: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(300), nullable=True)
    purchase_id: Mapped[int | None] = mapped_column(
        ForeignKey("purchases.purchase_id"), nullable=True
    )
    sale_id: Mapped[int | None] = mapped_column(
        ForeignKey("sales.sale_id"), nullable=True
    )
    user_email: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
