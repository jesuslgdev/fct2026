from modules.admin.domain.interfaces.repositories.i_user_repository import (
    IUserRepository,
)
from modules.admin.domain.interfaces.use_cases.users.i_list_users_use_case import (
    IListUsersUseCase,
)
from shared.domain.dtos.paginated_result import PaginatedResult
from shared.domain.entities.user import User


class ListUsersUseCase(IListUsersUseCase):
    def __init__(self, repo: IUserRepository) -> None:
        self.repo = repo

    async def execute(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        role: str | None = None,
        active: bool | None = None,
    ) -> PaginatedResult[User]:
        return await self.repo.get_all_paginated(
            page, page_size, search=search, role=role, active=active
        )
