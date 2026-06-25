from sqlalchemy import Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.database.base_model import Base


class Department(Base):
    __tablename__ = "departments"

    department_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    __table_args__ = (
        Index("ix_departments_name_lower", func.lower(name), unique=True),
    )
