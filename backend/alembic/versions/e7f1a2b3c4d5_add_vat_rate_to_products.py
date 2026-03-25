"""add vat_rate to products

Revision ID: e7f1a2b3c4d5
Revises: b5c6d7e8f9a0, d2fc5b80d35c
Create Date: 2026-03-25

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "e7f1a2b3c4d5"
down_revision: str | Sequence[str] | None = ("b5c6d7e8f9a0", "d2fc5b80d35c")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "vat_rate",
            sa.Numeric(5, 4),
            nullable=False,
            server_default="0.2100",
        ),
    )
    op.alter_column("products", "vat_rate", server_default=None)


def downgrade() -> None:
    op.drop_column("products", "vat_rate")
