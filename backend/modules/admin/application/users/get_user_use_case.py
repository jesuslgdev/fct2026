from modules.admin.domain.interfaces.repositories.i_user_repository import (
    IUserRepository,
)
from modules.admin.domain.interfaces.use_cases.users.i_get_user_use_case import (
    IGetUserUseCase,
)
from shared.domain.entities.user import User


class GetUserUseCase(IGetUserUseCase):
    def __init__(self, repo: IUserRepository) -> None:
        self.repo = repo

    async def execute(self, user_id: int) -> User | None:
        return await self.repo.get_by_id(user_id)
