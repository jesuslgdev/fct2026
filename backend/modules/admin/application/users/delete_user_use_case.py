from modules.admin.domain.exceptions import AdminException, AdminExceptionInfo
from modules.admin.domain.interfaces.repositories.i_user_repository import (
    IUserRepository,
)
from modules.admin.domain.interfaces.use_cases.users.i_delete_user_use_case import (
    IDeleteUserUseCase,
)
from shared.domain.interfaces.i_purchase_reader import IPurchaseReader


class DeleteUserUseCase(IDeleteUserUseCase):
    def __init__(
        self,
        user_repo: IUserRepository,
        purchase_reader: IPurchaseReader,
    ) -> None:
        self.user_repo = user_repo
        self.purchase_reader = purchase_reader

    async def execute(self, user_id: int) -> None:
        if await self.user_repo.get_by_id(user_id) is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)
        if await self.purchase_reader.has_purchases_for_user(user_id):
            raise AdminException(AdminExceptionInfo.USER_HAS_REFERENCES)
        await self.user_repo.delete(user_id)
