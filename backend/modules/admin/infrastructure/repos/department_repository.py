from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department
from modules.admin.domain.interfaces.i_department_repository import (
    IDepartmentRepository,
)


class DepartmentRepository(IDepartmentRepository):
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_all(self) -> list[Department]:
        result = await self._db.execute(select(Department).order_by(Department.name))
        return list(result.scalars().all())

    async def get_by_id(self, department_id: int) -> Department | None:
        raise NotImplementedError

    async def create(self, name: str) -> Department:
        raise NotImplementedError

    async def update(self, department_id: int, name: str) -> Department:
        raise NotImplementedError

    async def delete(self, department_id: int) -> None:
        raise NotImplementedError

    async def has_users(self, department_id: int) -> bool:
        raise NotImplementedError
