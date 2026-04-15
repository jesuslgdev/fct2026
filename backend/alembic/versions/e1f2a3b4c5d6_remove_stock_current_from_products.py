"""remove stock_current column from products

Revision ID: e1f2a3b4c5d6
Revises: d9e1f2a3b4c6
Create Date: 2026-04-15 00:00:00.000000

stock_current is now a computed column_property on the Product ORM entity,
derived from SUM(warehouse_stock.stock). The physical column is no longer needed.
"""

import sqlalchemy as sa

from alembic import op

revision = "e1f2a3b4c5d6"
down_revision = "d9e1f2a3b4c6"
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
