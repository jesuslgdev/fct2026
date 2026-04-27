from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from shared.config import settings
from shared.domain.entities.user import User


async def seed(session: AsyncSession) -> None:
    """Ensure the super-admin user exists."""
    result = await session.execute(
        select(User).where(User.email == settings.superadmin_email)
    )
    if result.scalar_one_or_none() is None:
        session.add(
            User(
                first_name="Admin",
                last_name="System",
                email=settings.superadmin_email,
                role="Administrator",
                is_active=True,
            )
        )

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
