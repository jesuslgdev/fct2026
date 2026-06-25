from modules.admin.domain.exceptions import AdminException, AdminExceptionInfo
from modules.admin.domain.interfaces.repositories.i_department_repository import (
    IDepartmentRepository,
)
from modules.admin.domain.interfaces.repositories.i_user_repository import (
    IUserRepository,
)
from modules.admin.domain.interfaces.use_cases.users.i_create_user_use_case import (
    ICreateUserUseCase,
)
from shared.domain.entities.user import User


class CreateUserUseCase(ICreateUserUseCase):
    def __init__(
        self,
        user_repo: IUserRepository,
        department_repo: IDepartmentRepository,
    ) -> None:
        self.user_repo = user_repo
        self.department_repo = department_repo

    async def execute(
        self,
        first_name: str,
        last_name: str,
        email: str,
        role: str,
        department_id: int | None,
    ) -> User:
        if await self.user_repo.get_by_email(email) is not None:
            raise AdminException(AdminExceptionInfo.USER_ALREADY_EXISTS)

        if role != "Administrator" and department_id is None:
            raise AdminException(AdminExceptionInfo.USER_DEPARTMENT_REQUIRED)

        if department_id is not None:
            if await self.department_repo.get_by_id(department_id) is None:
                raise AdminException(AdminExceptionInfo.USER_DEPARTMENT_NOT_FOUND)

        return await self.user_repo.create(
            first_name, last_name, email, role, department_id
        )
