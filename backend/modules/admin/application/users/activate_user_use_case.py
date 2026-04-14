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

    async def execute(self, user_id: int) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if user is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)
        if user.is_active:
            raise AdminException(AdminExceptionInfo.USER_ALREADY_ACTIVE)
        if user.is_deleted:
            raise AdminException(AdminExceptionInfo.USER_IS_DELETED)
        await self.user_repo.activate(user_id)
