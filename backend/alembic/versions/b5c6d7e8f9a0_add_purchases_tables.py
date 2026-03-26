"""add_purchases_tables

Revision ID: b5c6d7e8f9a0
Revises: 4bd6e6c99238
Create Date: 2026-03-18 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b5c6d7e8f9a0"
down_revision: str | Sequence[str] | None = "4bd6e6c99238"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "purchases",
        sa.Column("purchase_id", sa.Integer(), primary_key=True),
        sa.Column("purchase_number", sa.String(20), unique=True, nullable=False),
        sa.Column("supplier_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("warehouse_id", sa.Integer(), nullable=False),
        sa.Column(
            "purchase_date",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("status", sa.String(20), server_default="Pending", nullable=False),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=True),
        sa.Column("taxes", sa.Numeric(10, 2), nullable=True),
        sa.Column("total", sa.Numeric(10, 2), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["supplier_id"],
            ["suppliers.supplier_id"],
            name="fk_purchases_supplier_id_suppliers",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.user_id"],
            name="fk_purchases_user_id_users",
        ),
        sa.PrimaryKeyConstraint("purchase_id", name="pk_purchases"),
        sa.UniqueConstraint("purchase_number", name="uq_purchases_purchase_number"),
    )

    op.create_table(
        "purchase_lines",
        sa.Column("purchase_line_id", sa.Integer(), primary_key=True),
        sa.Column("purchase_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("discount", sa.Numeric(5, 2), server_default="0", nullable=False),
        sa.Column("line_subtotal", sa.Numeric(10, 2), nullable=False),
        sa.ForeignKeyConstraint(
            ["purchase_id"],
            ["purchases.purchase_id"],
            name="fk_purchase_lines_purchase_id_purchases",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.product_id"],
            name="fk_purchase_lines_product_id_products",
        ),
        sa.PrimaryKeyConstraint("purchase_line_id", name="pk_purchase_lines"),
    )


def downgrade() -> None:
    op.drop_table("purchase_lines")
    op.drop_table("purchases")
