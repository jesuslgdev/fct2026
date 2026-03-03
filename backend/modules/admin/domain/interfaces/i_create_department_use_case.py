from abc import ABC, abstractmethod

from modules.admin.domain.entities.department import Department


class ICreateDepartmentUseCase(ABC):
    @abstractmethod
    async def execute(self, name: str) -> Department:
        raise NotImplementedError
