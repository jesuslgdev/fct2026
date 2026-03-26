from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.database.base_model import Base


class PurchaseLine(Base):
    __tablename__ = "purchase_lines"

    purchase_line_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    purchase_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("purchases.purchase_id"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.product_id"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    discount: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    line_subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    vat_rate: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    line_tax: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
