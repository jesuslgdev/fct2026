from modules.admin.domain.entities.department import Department
from modules.admin.domain.interfaces.repositories.i_department_repository import (
    IDepartmentRepository,
)
from modules.admin.domain.interfaces.use_cases.departments.i_update_department_use_case import (
    IUpdateDepartmentUseCase,
)


class UpdateDepartmentUseCase(IUpdateDepartmentUseCase):
    def __init__(self, repo: IDepartmentRepository) -> None:
        self._repo = repo

    async def execute(self, department_id: int, name: str) -> Department:
        return await self._repo.update(department_id, name)
