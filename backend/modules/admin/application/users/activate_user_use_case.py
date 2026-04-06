from modules.admin.domain.exceptions import AdminException, AdminExceptionInfo
from modules.admin.domain.interfaces.repositories.i_user_repository import (
    IUserRepository,
)
from modules.admin.domain.interfaces.use_cases.users.i_activate_user_use_case import (
    IActivateUserUseCase,
)
from shared.constants import USER_DELETED_EMAIL_PREFIX, USER_DELETED_PLACEHOLDER


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
        if (
            first_name == USER_DELETED_PLACEHOLDER
            or last_name == USER_DELETED_PLACEHOLDER
            or email.startswith(USER_DELETED_EMAIL_PREFIX)
        ):
            raise AdminException(AdminExceptionInfo.USER_INVALID_ACTIVATION_DATA)
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
