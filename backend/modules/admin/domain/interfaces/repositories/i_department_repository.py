from abc import ABC, abstractmethod

from modules.admin.domain.entities.department import Department


class IDepartmentRepository(ABC):
    @abstractmethod
    async def get_all(self) -> list[Department]: ...

    @abstractmethod
    async def get_by_id(self, department_id: int) -> Department | None: ...

    @abstractmethod
    async def create(self, name: str) -> Department: ...

    @abstractmethod
    async def update(self, department_id: int, name: str) -> Department: ...

    @abstractmethod
    async def delete(self, department_id: int) -> None: ...

    @abstractmethod
    async def has_users(self, department_id: int) -> bool: ...
