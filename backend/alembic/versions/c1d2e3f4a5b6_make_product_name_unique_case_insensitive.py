"""make product name unique case insensitive

Revision ID: c1d2e3f4a5b6
Revises: f0a1b2c3d4e5
Create Date: 2026-04-16 12:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c1d2e3f4a5b6"
down_revision: str | Sequence[str] | None = "eb636a9414e3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        "CREATE UNIQUE INDEX ix_products_name_lower_trim "
        "ON products (lower(trim(name)))"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_products_name_lower_trim")
