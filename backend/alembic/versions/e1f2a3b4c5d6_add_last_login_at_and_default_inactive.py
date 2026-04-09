"""add last_login_at and default inactive users

Revision ID: e1f2a3b4c5d6
Revises: f8a9b0c1d2e3
Create Date: 2026-03-27 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "e1f2a3b4c5d6"
down_revision: str | None = "f8a9b0c1d2e3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "last_login_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )
    # Backfill: existing users are considered to have already logged in,
    # so they keep their active status and get last_login_at = now().
    op.execute("UPDATE users SET last_login_at = now() WHERE is_active = TRUE")
    # Change server default for is_active to FALSE for new users.
    op.alter_column(
        "users",
        "is_active",
        server_default=sa.false(),
        existing_type=sa.Boolean(),
        existing_nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "is_active",
        server_default=sa.true(),
        existing_type=sa.Boolean(),
        existing_nullable=False,
    )
    op.drop_column("users", "last_login_at")
