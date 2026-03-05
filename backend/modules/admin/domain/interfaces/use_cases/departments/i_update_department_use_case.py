from abc import ABC, abstractmethod

from modules.admin.domain.entities.department import Department


class IUpdateDepartmentUseCase(ABC):
    @abstractmethod
    async def execute(self, department_id: int, name: str) -> Department: ...
