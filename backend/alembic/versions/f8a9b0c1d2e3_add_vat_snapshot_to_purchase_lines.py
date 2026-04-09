"""add vat snapshot to purchase lines

Revision ID: f8a9b0c1d2e3
Revises: e7f1a2b3c4d5
Create Date: 2026-03-25

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "f8a9b0c1d2e3"
down_revision: str | Sequence[str] | None = "e7f1a2b3c4d5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "purchase_lines",
        sa.Column(
            "vat_rate",
            sa.Numeric(5, 4),
            nullable=False,
            server_default="0.2100",
        ),
    )
    op.alter_column("purchase_lines", "vat_rate", server_default=None)

    op.add_column(
        "purchase_lines",
        sa.Column(
            "line_tax",
            sa.Numeric(10, 2),
            nullable=False,
            server_default="0.00",
        ),
    )
    op.alter_column("purchase_lines", "line_tax", server_default=None)


def downgrade() -> None:
    op.drop_column("purchase_lines", "line_tax")
    op.drop_column("purchase_lines", "vat_rate")
