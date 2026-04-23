from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    func,
    select,
)
from sqlalchemy import column as sa_col
from sqlalchemy import table as sa_table
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from shared.infrastructure.database.base_model import Base

if TYPE_CHECKING:
    from modules.catalog.domain.entities.category import Category

# Lightweight reference to warehouse_stock — avoids cross-module import.
_ws = sa_table("warehouse_stock", sa_col("product_id"), sa_col("stock", Integer))


class Product(Base):
    """ORM entity for the products table.

    Attributes:
        product_id: Primary key.
        product_code: Unique natural key (SKU), max 50 chars, no spaces.
        name: Product name, max 150 chars.
        description: Optional long description, max 500 chars.
        category_id: ID of the parent category.
        price: Unit price (> 0), max 2 decimals.
        vat_rate: Applicable VAT rate (e.g. 0.21, 0.10, 0.04, 0.00).
        stock_current: Read-only computed total units across all warehouses.
        stock_min: Threshold for low stock alerts.
        is_active: Logical deletion flag.
    """

    __tablename__ = "products"

    product_id: Mapped[int] = mapped_column(primary_key=True)
    product_code: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.category_id"), nullable=False
    )
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    vat_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), nullable=False, default=Decimal("0.21")
    )
    stock_min: Mapped[int] = mapped_column(nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category: Mapped["Category"] = relationship(back_populates="products")  # type: ignore

    __table_args__ = (
        Index("ix_products_name_lower_trim", func.lower(func.trim(name)), unique=True),
    )


# Assigned after class definition so Product.product_id is a fully resolved
# InstrumentedAttribute that can be used in SQL expressions.
Product.stock_current = column_property(
    select(func.coalesce(func.sum(_ws.c.stock), 0))
    .where(_ws.c.product_id == Product.product_id)
    .correlate_except(_ws)
    .scalar_subquery()
)
