from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.exceptions import AdminException, AdminExceptionInfo
from modules.admin.domain.interfaces.repositories.i_user_repository import (
    IUserRepository,
)
from shared.constants import USER_DELETED_EMAIL_PREFIX, USER_DELETED_PLACEHOLDER
from shared.domain.dtos.paginated_result import PaginatedResult
from shared.domain.entities.user import User
from shared.domain.interfaces.i_user_reader import IUserReader


class UserRepository(IUserRepository, IUserReader):
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
        not_deleted = User.is_deleted == False  # noqa: E712
        base_query = select(User).where(not_deleted)
        count_query = select(func.count()).select_from(User).where(not_deleted)

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

    async def get_name_by_id(self, user_id: int) -> str | None:
        result = await self._db.execute(
            select(User.first_name, User.last_name).where(User.user_id == user_id)
        )
        row = result.one_or_none()
        if row is None:
            return None
        return f"{row.first_name} {row.last_name}"

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

    async def delete(self, user_id: int) -> None:
        user = await self.get_by_id(user_id)
        if user is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)
        await self._db.delete(user)
        await self._db.flush()

    async def deactivate(self, user_id: int) -> None:
        user = await self.get_by_id(user_id)
        if user is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)
        user.is_active = False
        await self._db.flush()

    async def activate(self, user_id: int) -> None:
        user = await self.get_by_id(user_id)
        if user is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)
        user.is_active = True
        await self._db.flush()

    async def anonymize(self, user_id: int) -> None:
        user = await self.get_by_id(user_id)
        if user is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)
        user.is_active = False
        user.is_deleted = True
        user.first_name = USER_DELETED_PLACEHOLDER
        user.last_name = USER_DELETED_PLACEHOLDER
        user.email = f"{USER_DELETED_EMAIL_PREFIX}{user_id}@deleted.com"
        await self._db.flush()
