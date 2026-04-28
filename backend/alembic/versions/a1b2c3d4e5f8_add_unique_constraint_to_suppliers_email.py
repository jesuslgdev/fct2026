"""add unique constraint to suppliers email

Revision ID: a1b2c3d4e5f8
Revises: 31eeae62e2f3
Create Date: 2026-04-21 11:30:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f8"
down_revision: str | Sequence[str] | None = "31eeae62e2f3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_unique_constraint(op.f("uq_suppliers_email"), "suppliers", ["email"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(op.f("uq_suppliers_email"), "suppliers", type_="unique")
