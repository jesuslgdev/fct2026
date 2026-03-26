from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.exceptions import AdminException, AdminExceptionInfo
from modules.admin.domain.interfaces.repositories.i_user_repository import (
    IUserRepository,
)
from shared.domain.entities.user import User
from shared.domain.paginated_result import PaginatedResult


class UserRepository(IUserRepository):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all_paginated(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        role: str | None = None,
        active: bool | None = None,
    ) -> PaginatedResult[User]:
        base_query = select(User)
        count_query = select(func.count()).select_from(User)

        if search:
            pattern = f"%{search}%"
            search_filter = (
                User.first_name.ilike(pattern)
                | User.last_name.ilike(pattern)
                | User.email.ilike(pattern)
            )
            base_query = base_query.where(search_filter)
            count_query = count_query.where(search_filter)

        if role is not None:
            base_query = base_query.where(User.role == role)
            count_query = count_query.where(User.role == role)

        if active is not None:
            base_query = base_query.where(User.is_active == active)
            count_query = count_query.where(User.is_active == active)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        result = await self._db.execute(
            base_query.order_by(User.user_id).limit(page_size).offset(offset)
        )
        items = list(result.scalars().all())

        return PaginatedResult(items=items, total=total, page=page, page_size=page_size)

    async def get_by_id(self, user_id: int) -> User | None:
        result = await self._db.execute(select(User).where(User.user_id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self._db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(
        self,
        first_name: str,
        last_name: str,
        email: str,
        role: str,
        department_id: int | None,
    ) -> User:
        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            role=role,
            department_id=department_id,
        )
        self._db.add(user)
        await self._db.flush()
        await self._db.refresh(user)
        return user

    async def update(
        self,
        user_id: int,
        first_name: str | None,
        last_name: str | None,
        role: str | None,
        department_id: int | None,
    ) -> User:
        user = await self.get_by_id(user_id)
        if user is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if role is not None:
            user.role = role
        if department_id is not None:
            user.department_id = department_id
        await self._db.flush()
        await self._db.refresh(user)
        return user

    async def set_active(self, user_id: int, is_active: bool) -> None:
        user = await self.get_by_id(user_id)
        if user is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)
        user.is_active = is_active
        await self._db.flush()
