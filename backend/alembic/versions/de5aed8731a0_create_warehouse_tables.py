"""create warehouse and warehouse_stock tables

Revision ID: de5aed8731a0
Revises: fa7e9d7ef5bd
Create Date: 2026-03-16 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "de5aed8731a0"
down_revision: str | Sequence[str] | None = "fa7e9d7ef5bd"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create warehouses and warehouse_stock tables."""
    op.create_table(
        "warehouses",
        sa.Column("warehouse_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("warehouse_id", name=op.f("pk_warehouses")),
        sa.UniqueConstraint("name", name=op.f("uq_warehouses_name")),
    )

    op.create_table(
        "warehouse_stock",
        sa.Column("warehouse_stock_id", sa.Integer(), nullable=False),
        sa.Column("warehouse_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("stock", sa.Integer(), nullable=False),
        sa.Column("reserved_stock", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["warehouse_id"],
            ["warehouses.warehouse_id"],
            name=op.f("fk_warehouse_stock_warehouse_id_warehouses"),
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.product_id"],
            name=op.f("fk_warehouse_stock_product_id_products"),
        ),
        sa.PrimaryKeyConstraint("warehouse_stock_id", name=op.f("pk_warehouse_stock")),
        sa.UniqueConstraint(
            "warehouse_id",
            "product_id",
            name=op.f("uq_warehouse_stock_warehouse_id"),
        ),
    )


def downgrade() -> None:
    """Drop warehouse_stock and warehouses tables."""
    op.drop_table("warehouse_stock")
    op.drop_table("warehouses")
