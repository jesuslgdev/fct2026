from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.infrastructure.database.base_model import Base

if TYPE_CHECKING:
    from modules.catalog.domain.entities.category import Category


class Product(Base):
    """ORM entity for the products table.

    Attributes:
        product_id: Primary key.
        product_code: Unique natural key (SKU), max 50 chars, no spaces.
        name: Product name, max 150 chars.
        description: Optional long description, max 500 chars.
        category_id: ID of the parent category.
        price: Unit price (> 0), max 2 decimals.
        stock_current: Current units in inventory.
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
    stock_current: Mapped[int] = mapped_column(nullable=False, default=0)
    stock_min: Mapped[int] = mapped_column(nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category: Mapped["Category"] = relationship(back_populates="products")  # type: ignore
