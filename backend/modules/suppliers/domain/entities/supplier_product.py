from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.database.base_model import Base


class SupplierProduct(Base):
    __tablename__ = "supplier_products"

    supplier_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("suppliers.supplier_id"), primary_key=True
    )
    product_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("products.product_id"), primary_key=True
    )
    supplier_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
