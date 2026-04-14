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
        user = await self.user_repo.get_by_id(user_id)
        if user is None:
            raise AdminException(AdminExceptionInfo.USER_NOT_FOUND)
        if user.is_deleted:
            raise AdminException(AdminExceptionInfo.USER_IS_DELETED)
        if await self.purchase_reader.has_purchases_for_user(user_id):
            await self.user_repo.anonymize(user_id)
        else:
            await self.user_repo.delete(user_id)
