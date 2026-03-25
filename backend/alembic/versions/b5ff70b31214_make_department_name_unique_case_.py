"""make department name unique case insensitive

Revision ID: b5ff70b31214
Revises: e3f4a5b6c7d8
Create Date: 2026-03-25 10:29:23.563515

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b5ff70b31214"
down_revision: str | Sequence[str] | None = "e3f4a5b6c7d8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("uq_departments_name", table_name="departments", if_exists=True)
    op.execute(
        "CREATE UNIQUE INDEX ix_departments_name_lower ON departments (lower(name))"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_departments_name_lower")
    op.create_index("uq_departments_name", "departments", ["name"], unique=True)
