from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department
from modules.admin.domain.exceptions import AdminException, AdminExceptionInfo
from modules.admin.domain.interfaces.repositories.i_department_repository import (
    IDepartmentRepository,
)
from shared.domain.entities.user import User
from shared.domain.interfaces.i_department_reader import IDepartmentReader


class DepartmentRepository(IDepartmentRepository, IDepartmentReader):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all(self) -> list[Department]:
        result = await self._db.execute(select(Department).order_by(Department.name))
        return list(result.scalars().all())

    async def get_by_id(self, department_id: int) -> Department | None:
        result = await self._db.execute(
            select(Department).where(Department.department_id == department_id)
        )
        return result.scalar_one_or_none()

    async def create(self, name: str) -> Department:
        try:
            dept = Department(name=name)
            self._db.add(dept)
            await self._db.flush()
            await self._db.refresh(dept)
            return dept
        except IntegrityError:
            raise AdminException(AdminExceptionInfo.DEPARTMENT_ALREADY_EXISTS)

    async def update(self, department_id: int, name: str) -> Department:
        dept = await self.get_by_id(department_id)
        if dept is None:
            raise AdminException(AdminExceptionInfo.DEPARTMENT_NOT_FOUND)
        try:
            dept.name = name
            await self._db.flush()
            await self._db.refresh(dept)
            return dept
        except IntegrityError:
            raise AdminException(AdminExceptionInfo.DEPARTMENT_ALREADY_EXISTS)

    async def delete(self, department_id: int) -> None:
        dept = await self.get_by_id(department_id)
        if dept is not None:
            await self._db.delete(dept)
            await self._db.flush()

    async def has_users(self, department_id: int) -> bool:
        result = await self._db.execute(
            select(User).where(User.department_id == department_id)
        )
        return result.scalar_one_or_none() is not None

    async def get_name_by_id(self, department_id: int) -> str | None:
        result = await self._db.execute(
            select(Department.name).where(Department.department_id == department_id)
        )
        return result.scalar_one_or_none()
