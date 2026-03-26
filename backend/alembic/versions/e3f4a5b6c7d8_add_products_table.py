"""add_products_table

Revision ID: e3f4a5b6c7d8
Revises: d2fc5b80d35c
Create Date: 2026-03-20 12:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "e3f4a5b6c7d8"
down_revision: str = "d2fc5b80d35c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("product_id", sa.Integer(), primary_key=True),
        sa.Column("product_code", sa.String(50), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column(
            "category_id",
            sa.Integer(),
            sa.ForeignKey("categories.category_id"),
            nullable=False,
        ),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("stock_current", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("stock_min", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.create_index(
        "ix_products_product_code", "products", ["product_code"], unique=True
    )


def downgrade() -> None:
    op.drop_index("ix_products_product_code", table_name="products")
    op.drop_table("products")
