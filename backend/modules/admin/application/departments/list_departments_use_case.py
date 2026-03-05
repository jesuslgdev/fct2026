from modules.admin.domain.entities.department import Department
from modules.admin.domain.interfaces.repositories.i_department_repository import (
    IDepartmentRepository,
)
from modules.admin.domain.interfaces.use_cases.departments.i_list_departments_use_case import (
    IListDepartmentsUseCase,
)


class ListDepartmentsUseCase(IListDepartmentsUseCase):
    def __init__(self, repo: IDepartmentRepository) -> None:
        self._repo = repo

    async def execute(self) -> list[Department]:
        return await self._repo.get_all()
