"""add_supplier_products_product_fk

Revision ID: 4bd6e6c99238
Revises: fa7e9d7ef5bd
Create Date: 2026-03-16 13:40:02.919168

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4bd6e6c99238"
down_revision: str | Sequence[str] | None = "fa7e9d7ef5bd"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = "e3f4a5b6c7d8"


def upgrade() -> None:
    """Upgrade schema."""
    op.create_foreign_key(
        op.f("fk_supplier_products_product_id_products"),
        "supplier_products",
        "products",
        ["product_id"],
        ["product_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        op.f("fk_supplier_products_product_id_products"),
        "supplier_products",
        type_="foreignkey",
    )
