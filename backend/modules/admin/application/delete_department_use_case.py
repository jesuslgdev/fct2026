from modules.admin.domain.interfaces.use_cases.departments.i_delete_department_use_case import (
    IDeleteDepartmentUseCase,
)
from modules.admin.domain.interfaces.repositories.i_department_repository import (
    IDepartmentRepository,
)


class DeleteDepartmentUseCase(IDeleteDepartmentUseCase):
    def __init__(self, repo: IDepartmentRepository) -> None:
        self._repo = repo

    async def execute(self, department_id: int) -> None:
        dept = await self._repo.get_by_id(department_id)
        if dept is None:
            raise ValueError("Department not found")
        if await self._repo.has_users(department_id):
            raise ValueError("Department has associated users")
        await self._repo.delete(department_id)
