"""merge discount and purchase status history heads

Revision ID: 31eeae62e2f3
Revises: e3f4a5b6c7d8, e5f6a7b8c9d0
Create Date: 2026-04-21 09:14:57.787627

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "31eeae62e2f3"
down_revision: str | Sequence[str] | None = ("e3f4a5b6c7d8", "e5f6a7b8c9d0")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
