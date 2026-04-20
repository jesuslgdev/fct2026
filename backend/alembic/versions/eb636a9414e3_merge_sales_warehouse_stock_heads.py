"""merge sales warehouse stock heads

Revision ID: eb636a9414e3
Revises: 9d1e2f3a4b5c, f0a1b2c3d4e5
Create Date: 2026-04-15 10:51:42.992010

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "eb636a9414e3"
down_revision: str | Sequence[str] | None = ("9d1e2f3a4b5c", "f0a1b2c3d4e5")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
