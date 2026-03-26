from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.database.base_model import Base


class WarehouseStock(Base):
    """ORM entity for the warehouse_stock table.

    Tracks how many units of a given product are held in each warehouse.

    Attributes:
        warehouse_stock_id: Primary key.
        warehouse_id: Foreign key to the warehouses table.
        product_id: Foreign key to the products table.
        stock: Total physical units stored in this warehouse.
        reserved_stock: Units committed by approved or in-process sales.
    """

    __tablename__ = "warehouse_stock"
    __table_args__ = (UniqueConstraint("warehouse_id", "product_id"),)

    warehouse_stock_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    warehouse_id: Mapped[int] = mapped_column(
        ForeignKey("warehouses.warehouse_id"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.product_id"), nullable=False
    )
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reserved_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    @property
    def available_stock(self) -> int:
        """Units available for new sales: stock minus reserved."""
        return self.stock - self.reserved_stock
