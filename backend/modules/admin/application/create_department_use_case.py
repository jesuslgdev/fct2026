from modules.admin.domain.entities.department import Department
from modules.admin.domain.interfaces.use_cases.departments.i_create_department_use_case import (
    ICreateDepartmentUseCase,
)
from modules.admin.domain.interfaces.repositories.i_department_repository import (
    IDepartmentRepository,
)


class CreateDepartmentUseCase(ICreateDepartmentUseCase):
    def __init__(self, repo: IDepartmentRepository) -> None:
        self._repo = repo

    async def execute(self, name: str) -> Department:
        return await self._repo.create(name)
