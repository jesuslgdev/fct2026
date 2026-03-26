from abc import ABC, abstractmethod

from modules.admin.domain.entities.department import Department


class IGetDepartmentUseCase(ABC):
    @abstractmethod
    async def execute(self, department_id: int) -> Department | None: ...
