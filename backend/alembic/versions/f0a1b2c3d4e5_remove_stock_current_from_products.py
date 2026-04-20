"""remove stock_current column from products

Revision ID: f0a1b2c3d4e5
Revises: b2c3d4e5f6a7
Create Date: 2026-04-15 00:00:00.000000

stock_current is now a computed column_property on the Product ORM entity,
derived from SUM(warehouse_stock.stock). The physical column is no longer needed.
"""

import sqlalchemy as sa

from alembic import op

revision = "f0a1b2c3d4e5"
down_revision = "b2c3d4e5f6a7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("products", "stock_current")


def downgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "stock_current",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
