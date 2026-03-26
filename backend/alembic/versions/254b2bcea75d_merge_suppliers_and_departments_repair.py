""" "merge_suppliers_and_departments_repair"

Revision ID: 254b2bcea75d
Revises: 3c7a1f9e2b84, c3d4e5f6a1b2
Create Date: 2026-03-11 10:46:06.339707

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "254b2bcea75d"
down_revision: str | Sequence[str] | None = ("3c7a1f9e2b84", "c3d4e5f6a1b2")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
