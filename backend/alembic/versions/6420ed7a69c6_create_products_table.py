"""create_products_table

Revision ID: 6420ed7a69c6
Revises: c4f8a21e9d35
Create Date: 2026-03-12 13:23:36.382618

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "6420ed7a69c6"
down_revision: str | Sequence[str] | None = "c4f8a21e9d35"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "products",
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("product_code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("stock_current", sa.Integer(), nullable=False),
        sa.Column("stock_min", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(
            ["category_id"],
            ["categories.category_id"],
            name=op.f("fk_products_category_id_categories"),
        ),
        sa.PrimaryKeyConstraint("product_id", name=op.f("pk_products")),
    )
    op.create_index(
        op.f("ix_products_product_code"), "products", ["product_code"], unique=True
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_products_product_code"), table_name="products")
    op.drop_table("products")
