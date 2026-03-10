from modules.admin.domain.entities.department import Department
from modules.admin.domain.exceptions import AdminException, AdminExceptionInfo
from modules.admin.domain.interfaces.repositories.i_department_repository import (
    IDepartmentRepository,
)
from modules.admin.domain.interfaces.use_cases.departments.i_get_department_use_case import (
    IGetDepartmentUseCase,
)


class GetDepartmentUseCase(IGetDepartmentUseCase):
    def __init__(self, repo: IDepartmentRepository) -> None:
        self.repo = repo

    async def execute(self, department_id: int) -> Department:
        dept = await self.repo.get_by_id(department_id)
        if dept is None:
            raise AdminException(AdminExceptionInfo.DEPARTMENT_NOT_FOUND)
        return dept
