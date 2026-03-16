from modules.admin.domain.exceptions import AdminException, AdminExceptionInfo
from modules.admin.domain.interfaces.repositories.i_user_repository import (
    IUserRepository,
)
from modules.admin.domain.interfaces.use_cases.users.i_set_user_active_use_case import (
    ISetUserActiveUseCase,
)


class SetUserActiveUseCase(ISetUserActiveUseCase):
    def __init__(self, repo: IUserRepository) -> None:
        self.repo = repo

    async def execute(self, user_id: int, is_active: bool) -> None:
        if await self.repo.get_by_id(user_id) is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)

        await self.repo.set_active(user_id, is_active)
