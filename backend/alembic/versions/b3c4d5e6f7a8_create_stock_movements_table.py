"""create stock_movements table

Revision ID: b3c4d5e6f7a8
Revises: de5aed8731a0
Create Date: 2026-03-19 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b3c4d5e6f7a8"
down_revision: str | Sequence[str] | None = "de5aed8731a0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create stock_movements table."""
    op.create_table(
        "stock_movements",
        sa.Column("movement_id", sa.Integer(), nullable=False),
        sa.Column("warehouse_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("movement_type", sa.String(length=30), nullable=False),
        sa.Column("previous_quantity", sa.Integer(), nullable=False),
        sa.Column("new_quantity", sa.Integer(), nullable=False),
        sa.Column("difference", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=300), nullable=True),
        sa.Column("user_email", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["warehouse_id"],
            ["warehouses.warehouse_id"],
            name=op.f("fk_stock_movements_warehouse_id_warehouses"),
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.product_id"],
            name=op.f("fk_stock_movements_product_id_products"),
        ),
        sa.PrimaryKeyConstraint("movement_id", name=op.f("pk_stock_movements")),
    )
    op.create_index(
        op.f("ix_stock_movements_warehouse_id"),
        "stock_movements",
        ["warehouse_id"],
    )
    op.create_index(
        op.f("ix_stock_movements_product_id"),
        "stock_movements",
        ["product_id"],
    )


def downgrade() -> None:
    """Drop stock_movements table."""
    op.drop_index(op.f("ix_stock_movements_product_id"), table_name="stock_movements")
    op.drop_index(op.f("ix_stock_movements_warehouse_id"), table_name="stock_movements")
    op.drop_table("stock_movements")
