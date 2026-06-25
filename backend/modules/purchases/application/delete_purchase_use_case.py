from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.purchases.domain.interfaces.use_cases.i_delete_purchase_use_case import (
    IDeletePurchaseUseCase,
)


class DeletePurchaseUseCase(IDeletePurchaseUseCase):
    def __init__(self, purchase_repo: IPurchaseRepository) -> None:
        self._purchase_repo = purchase_repo

    async def execute(self, purchase_id: int) -> None:
        purchase = await self._purchase_repo.get_by_id(purchase_id)
        if purchase is None:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)
        if purchase.status != "Pending":
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_DELETABLE)
        await self._purchase_repo.delete_purchase(purchase_id)
