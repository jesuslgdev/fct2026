from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.config import settings
from shared.domain.entities.user import User


async def seed(session: AsyncSession) -> None:
    """Insert the super-admin user if it does not already exist."""
    result = await session.execute(
        select(User).where(User.email == settings.superadmin_email)
    )
    if result.scalar_one_or_none() is not None:
        return

    # TODO: department_id omitted — assign a real department once the
    # departments table and admin module are implemented.
    admin = User(
        first_name="Admin",
        last_name="System",
        email=settings.superadmin_email,
        role="Administrator",
        is_active=True,
    )
    session.add(admin)
    await session.commit()
