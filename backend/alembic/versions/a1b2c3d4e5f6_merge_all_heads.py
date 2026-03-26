"""merge all heads

Revision ID: a1b2c3d4e5f6
Revises: 254b2bcea75d, 4a6fcd3dde06
Create Date: 2026-03-16 00:00:00.000000

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = ("254b2bcea75d", "4a6fcd3dde06")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
