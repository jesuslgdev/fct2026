"""merge sales lifecycle and catalog product-name heads

Revision ID: f1a2b3c4d5e6
Revises: c1d2e3f4a5b6, e2f3a4b5c6d7
Create Date: 2026-04-20 09:00:00.000000

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: str | Sequence[str] | None = ("c1d2e3f4a5b6", "e2f3a4b5c6d7")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
