"""merge categories into main line

Revision ID: d2fc5b80d35c
Revises: a1b2c3d4e5f6, c4f8a21e9d35
Create Date: 2026-03-19 07:47:03.094126

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "d2fc5b80d35c"
down_revision: str | Sequence[str] | None = ("a1b2c3d4e5f6", "c4f8a21e9d35")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
