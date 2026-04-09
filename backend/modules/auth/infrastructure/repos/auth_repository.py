from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.auth.domain.interfaces.repositories.i_auth_repository import (
    IAuthRepository,
)
from shared.domain.entities.user import User


class AuthRepository(IAuthRepository):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def find_user_by_email(self, email: str) -> User | None:
        result = await self._db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def activate_user(self, user_id: int) -> None:
        result = await self._db.execute(select(User).where(User.user_id == user_id))
        user = result.scalar_one_or_none()
        if user is not None:
            user.is_active = True
            user.last_login_at = datetime.now(UTC)
            await self._db.flush()

    async def update_last_login(self, user_id: int) -> None:
        result = await self._db.execute(select(User).where(User.user_id == user_id))
        user = result.scalar_one_or_none()
        if user is not None:
            user.last_login_at = datetime.now(UTC)
            await self._db.flush()
