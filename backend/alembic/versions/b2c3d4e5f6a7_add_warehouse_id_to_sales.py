"""add warehouse_id to sales

Revision ID: b2c3d4e5f6a7
Revises: 80f43570db6f
Create Date: 2026-04-15 00:00:00.000000

The sale header now records which warehouse fulfils the order.
Stock availability is validated against this warehouse at creation time.
"""

import sqlalchemy as sa

from alembic import op

revision = "b2c3d4e5f6a7"
down_revision = "80f43570db6f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "sales",
        sa.Column("warehouse_id", sa.Integer(), nullable=False),
    )
    op.create_foreign_key(
        "fk_sales_warehouse_id",
        "sales",
        "warehouses",
        ["warehouse_id"],
        ["warehouse_id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_sales_warehouse_id", "sales", type_="foreignkey")
    op.drop_column("sales", "warehouse_id")
