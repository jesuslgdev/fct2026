from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, composite, mapped_column

from shared.domain.dtos.address import Address
from shared.infrastructure.database.base_model import Base


class Warehouse(Base):
    """ORM entity for the warehouses table.

    Attributes:
        warehouse_id: Primary key.
        name: Unique warehouse name, max 100 characters.
        street: Street line of the physical location.
        city: City of the physical location.
        province: Province/state of the physical location.
        postal_code: Postal code of the physical location.
        address_data: Composite address value object for domain use.
    """

    __tablename__ = "warehouses"

    warehouse_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    street: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    province: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(10), nullable=False)
    address_data: Mapped[Address] = composite(
        Address, street, city, province, postal_code
    )
