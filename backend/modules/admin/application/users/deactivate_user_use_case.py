from modules.admin.domain.exceptions import AdminException, AdminExceptionInfo
from modules.admin.domain.interfaces.repositories.i_user_repository import (
    IUserRepository,
)
from modules.admin.domain.interfaces.use_cases.users.i_deactivate_user_use_case import (
    IDeactivateUserUseCase,
)


class DeactivateUserUseCase(IDeactivateUserUseCase):
    def __init__(self, user_repo: IUserRepository) -> None:
        self.user_repo = user_repo

    async def execute(self, user_id: int) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if user is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)
        if not user.is_active:
            raise AdminException(AdminExceptionInfo.USER_ALREADY_INACTIVE)
        await self.user_repo.deactivate(user_id)
