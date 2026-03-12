from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from shared.infrastructure.database.base_model import Base


class Category(Base):
    """ORM entity for the categories table.

    Attributes:
        category_id: Primary key.
        name: Unique category name, max 100 characters.
        description: Optional description, max 500 characters.
    """

    __tablename__ = "categories"

    category_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False, default="")
