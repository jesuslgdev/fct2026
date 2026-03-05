from abc import ABC, abstractmethod


class IDeleteDepartmentUseCase(ABC):
    @abstractmethod
    async def execute(self, department_id: int) -> None: ...
