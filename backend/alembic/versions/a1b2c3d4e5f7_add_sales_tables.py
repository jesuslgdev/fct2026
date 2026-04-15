"""add sales tables

Revision ID: a1b2c3d4e5f7
Revises: e1f2a3b4c5d6
Create Date: 2026-04-06 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a1b2c3d4e5f7"
down_revision: str | None = "e1f2a3b4c5d6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sales",
        sa.Column("sale_id", sa.Integer(), nullable=False),
        sa.Column("sale_number", sa.String(length=20), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("delivery_address", sa.String(length=500), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "sale_date",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("taxes", sa.Numeric(10, 2), nullable=False),
        sa.Column("total", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("sale_id", name=op.f("pk_sales")),
        sa.UniqueConstraint("sale_number", name=op.f("uq_sales_sale_number")),
        sa.ForeignKeyConstraint(
            ["client_id"],
            ["clients.client_id"],
            name=op.f("fk_sales_client_id_clients"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.user_id"],
            name=op.f("fk_sales_user_id_users"),
        ),
    )

    op.create_table(
        "sale_lines",
        sa.Column("sale_line_id", sa.Integer(), nullable=False),
        sa.Column("sale_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("line_subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("vat_rate", sa.Numeric(5, 4), nullable=False),
        sa.Column("line_tax", sa.Numeric(10, 2), nullable=False),
        sa.PrimaryKeyConstraint("sale_line_id", name=op.f("pk_sale_lines")),
        sa.ForeignKeyConstraint(
            ["sale_id"],
            ["sales.sale_id"],
            name=op.f("fk_sale_lines_sale_id_sales"),
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.product_id"],
            name=op.f("fk_sale_lines_product_id_products"),
        ),
    )


def downgrade() -> None:
    op.drop_table("sale_lines")
    op.drop_table("sales")
