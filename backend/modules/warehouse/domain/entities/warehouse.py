from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.database.base_model import Base


class Warehouse(Base):
    """ORM entity for the warehouses table.

    Attributes:
        warehouse_id: Primary key.
        name: Unique warehouse name, max 100 characters.
        address: Physical location, max 255 characters.
    """

    __tablename__ = "warehouses"

    warehouse_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
