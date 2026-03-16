from modules.admin.domain.exceptions import AdminException, AdminExceptionInfo
from modules.admin.domain.interfaces.repositories.i_department_repository import (
    IDepartmentRepository,
)
from modules.admin.domain.interfaces.repositories.i_user_repository import (
    IUserRepository,
)
from modules.admin.domain.interfaces.use_cases.users.i_update_user_use_case import (
    IUpdateUserUseCase,
)
from shared.domain.entities.user import User


class UpdateUserUseCase(IUpdateUserUseCase):
    def __init__(
        self,
        user_repo: IUserRepository,
        department_repo: IDepartmentRepository,
    ) -> None:
        self.user_repo = user_repo
        self.department_repo = department_repo

    async def execute(
        self,
        user_id: int,
        first_name: str | None,
        last_name: str | None,
        role: str | None,
        department_id: int | None,
    ) -> User:
        if await self.user_repo.get_by_id(user_id) is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)

        if department_id is not None:
            if await self.department_repo.get_by_id(department_id) is None:
                raise AdminException(AdminExceptionInfo.USER_DEPARTMENT_NOT_FOUND)

        return await self.user_repo.update(
            user_id, first_name, last_name, role, department_id
        )
