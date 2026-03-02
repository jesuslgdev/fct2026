from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.database.base_model import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    rol: Mapped[str] = mapped_column(String(50), nullable=False)
    # TODO: id_departamento is temporarily defined without a ForeignKey constraint
    # because the "departamentos" table does not exist yet (it belongs to a later fase).
    # Adding a ForeignKey here would cause the migration to fail.
    # Once the admin module creates the departamentos table, restore the FK:
    #   ForeignKey("departamentos.id_departamento")
    # and set nullable=False.
    id_departamento: Mapped[int | None] = mapped_column(Integer, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
