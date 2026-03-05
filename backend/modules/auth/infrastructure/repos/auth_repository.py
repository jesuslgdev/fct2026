from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.auth.domain.interfaces.repositories.i_auth_repository import IAuthRepository
from shared.domain.entities.user import User


class AuthRepository(IAuthRepository):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def find_active_user_by_email(self, email: str) -> User | None:
        result = await self._db.execute(
            select(User).where(User.email == email, User.is_active.is_(True))
        )
        return result.scalar_one_or_none()
