from abc import ABC, abstractmethod

from modules.admin.domain.entities.department import Department


class IListDepartmentsUseCase(ABC):
    @abstractmethod
    async def execute(self) -> list[Department]: ...
