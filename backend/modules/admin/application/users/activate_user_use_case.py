from modules.admin.domain.exceptions import AdminException, AdminExceptionInfo
from modules.admin.domain.interfaces.repositories.i_user_repository import (
    IUserRepository,
)
from modules.admin.domain.interfaces.use_cases.users.i_activate_user_use_case import (
    IActivateUserUseCase,
)


class ActivateUserUseCase(IActivateUserUseCase):
    def __init__(self, user_repo: IUserRepository) -> None:
        self.user_repo = user_repo

    async def execute(
        self,
        user_id: int,
        first_name: str,
        last_name: str,
        email: str,
    ) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if user is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)
        if user.is_active:
            raise AdminException(AdminExceptionInfo.USER_ALREADY_ACTIVE)
        if await self.user_repo.get_by_email(email) is not None:
            raise AdminException(AdminExceptionInfo.USER_ALREADY_EXISTS)
        if user.role != "Administrator" and user.department_id is None:
            raise AdminException(AdminExceptionInfo.USER_DEPARTMENT_REQUIRED)
        await self.user_repo.activate(user_id, first_name, last_name, email)
