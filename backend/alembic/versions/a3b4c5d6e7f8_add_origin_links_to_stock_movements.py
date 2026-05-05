"""add origin links (purchase_id, sale_id) to stock_movements

Revision ID: a3b4c5d6e7f8
Revises: 31eeae62e2f3
Create Date: 2026-04-29

Adds nullable foreign keys to purchases and sales so each movement can
link directly to its origin document for traceability.
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a3b4c5d6e7f8"
down_revision: str | Sequence[str] | None = "31eeae62e2f3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "stock_movements",
        sa.Column("purchase_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "stock_movements",
        sa.Column("sale_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_stock_movements_purchase_id_purchases",
        "stock_movements",
        "purchases",
        ["purchase_id"],
        ["purchase_id"],
    )
    op.create_foreign_key(
        "fk_stock_movements_sale_id_sales",
        "stock_movements",
        "sales",
        ["sale_id"],
        ["sale_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_stock_movements_sale_id_sales",
        "stock_movements",
        type_="foreignkey",
    )
    op.drop_constraint(
        "fk_stock_movements_purchase_id_purchases",
        "stock_movements",
        type_="foreignkey",
    )
    op.drop_column("stock_movements", "sale_id")
    op.drop_column("stock_movements", "purchase_id")
