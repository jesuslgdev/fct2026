from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, composite, mapped_column

from shared.domain.dtos.address import Address
from shared.infrastructure.database.base_model import Base


class Client(Base):
    """ORM entity representing a client in the system (HU-07).

    Maps to the `clients` table in the database. A client is any natural or
    legal person that can place sales orders. Each client is uniquely identified
    by their Spanish tax ID (NIF/NIE/CIF), which is validated and stored in
    uppercase before persisting.

    Soft-deletion is handled via the `is_active` flag — records are never
    physically deleted so that historical sales orders remain intact.
    """

    __tablename__ = "clients"

    # --- Identity ---
    client_id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # --- Legal / contact info ---
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    # Spanish NIF/NIE/CIF. Validated by the use case before insertion.
    # Always stored in uppercase. Unique across all clients.
    tax_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    # --- Address ---
    street: Mapped[str] = mapped_column(String(300), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    province: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(10), nullable=False)
    address_data: Mapped[Address] = composite(
        Address, street, city, province, postal_code
    )

    # --- Contact ---
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    # --- Status ---
    # Soft-delete flag. Inactive clients are hidden from normal listings
    # but their data is preserved for historical order records.
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # --- Audit timestamps (set automatically by the database) ---
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),  # refreshed automatically on every UPDATE
        nullable=False,
    )
