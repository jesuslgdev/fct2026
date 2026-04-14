from modules.purchases.domain.entities.purchase import Purchase
from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.purchases.domain.interfaces.use_cases.i_cancel_purchase_use_case import (
    ICancelPurchaseUseCase,
)


class CancelPurchaseUseCase(ICancelPurchaseUseCase):
    def __init__(self, purchase_repo: IPurchaseRepository) -> None:
        self._purchase_repo = purchase_repo

    async def execute(self, purchase_id: int, user_id: int) -> Purchase:
        purchase = await self._purchase_repo.get_by_id(purchase_id)
        if purchase is None:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)
        if purchase.status not in ("Pending", "Approved"):
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_CANCELLABLE)
        return await self._purchase_repo.cancel_purchase(purchase_id, user_id)
