from modules.purchases.domain.entities.purchase import Purchase
from modules.purchases.domain.entities.purchase_status_history import (
    PurchaseStatusHistory,
)
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
        from_status = purchase.status
        cancelled_purchase = await self._purchase_repo.cancel_purchase(purchase_id, user_id)
        history = PurchaseStatusHistory(
            purchase_id=cancelled_purchase.purchase_id,
            from_status=from_status,
            to_status="Cancelled",
            changed_by_user_id=user_id,
        )
        await self._purchase_repo.add_status_history(history)
        refreshed = await self._purchase_repo.get_by_id(cancelled_purchase.purchase_id)
        return refreshed if refreshed is not None else cancelled_purchase
