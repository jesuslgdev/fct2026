"""add supplier_products table

Revision ID: c3d4e5f6a1b2
Revises: bea4c4d77e2b
Create Date: 2026-03-10 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a1b2"
down_revision: str | Sequence[str] | None = "bea4c4d77e2b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "supplier_products",
        sa.Column("supplier_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("supplier_price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.ForeignKeyConstraint(
            ["supplier_id"],
            ["suppliers.supplier_id"],
            name=op.f("fk_supplier_products_supplier_id_suppliers"),
        ),
        sa.PrimaryKeyConstraint(
            "supplier_id", "product_id", name=op.f("pk_supplier_products")
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("supplier_products")
