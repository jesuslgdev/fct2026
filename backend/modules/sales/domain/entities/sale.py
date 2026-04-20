from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.infrastructure.database.base_model import Base

if TYPE_CHECKING:
    from modules.sales.domain.entities.sale_line import SaleLine


class Sale(Base):
    __tablename__ = "sales"

    sale_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sale_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    client_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("clients.client_id"), nullable=False
    )
    warehouse_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("warehouses.warehouse_id"), nullable=False
    )
    delivery_address: Mapped[str] = mapped_column(String(500), nullable=False)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.user_id"), nullable=False
    )
    sale_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="Pending", nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    taxes: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    lines: Mapped[list[SaleLine]] = relationship("SaleLine", lazy="selectin")
