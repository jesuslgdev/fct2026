from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department
from modules.admin.domain.interfaces.repositories.i_department_repository import (
    IDepartmentRepository,
)
from shared.domain.entities.user import User


class DepartmentRepository(IDepartmentRepository):
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
        dept = Department(name=name)
        self._db.add(dept)
        await self._db.flush()
        await self._db.refresh(dept)
        return dept

    async def update(self, department_id: int, name: str) -> Department:
        dept = await self.get_by_id(department_id)
        if dept is None:
            raise ValueError("Department not found")
        dept.name = name
        await self._db.flush()
        await self._db.refresh(dept)
        return dept

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
