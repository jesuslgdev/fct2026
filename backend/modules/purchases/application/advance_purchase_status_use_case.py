from modules.purchases.domain.entities.purchase import Purchase
from modules.purchases.domain.entities.purchase_status_history import (
    PurchaseStatusHistory,
)
from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.purchases.domain.interfaces.use_cases.i_advance_purchase_status_use_case import (
    IAdvancePurchaseStatusUseCase,
)
from modules.purchases.domain.purchase_status import (
    APPROVED,
    IN_PROCESS,
    PENDING,
    RECEIVED,
    SENT,
)
from shared.domain.dtos.user_session import UserSession
from shared.domain.interfaces.i_stock_entry_recorder import IStockEntryRecorder

VALID_TRANSITIONS: dict[str, set[str]] = {
    PENDING: {APPROVED},
    APPROVED: {IN_PROCESS},
    IN_PROCESS: {SENT},
    SENT: {RECEIVED},
}


class AdvancePurchaseStatusUseCase(IAdvancePurchaseStatusUseCase):
    def __init__(
        self,
        purchase_repo: IPurchaseRepository,
        stock_recorder: IStockEntryRecorder,
    ) -> None:
        self._purchase_repo = purchase_repo
        self._stock_recorder = stock_recorder

    async def execute(
        self, purchase_id: int, new_status: str, actor: UserSession
    ) -> Purchase:
        purchase = await self._purchase_repo.get_by_id(purchase_id)
        if purchase is None:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)

        if new_status not in VALID_TRANSITIONS.get(purchase.status, set()):
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_INVALID_TRANSITION)

        from_status = purchase.status

        if new_status == "Received":
            reason = f"Purchase received: {purchase.purchase_number}"
            for line in purchase.lines:
                await self._stock_recorder.add_stock(
                    warehouse_id=purchase.warehouse_id,
                    product_id=line.product_id,
                    quantity=line.quantity,
                    user_email=actor.email,
                    reason=reason,
                    purchase_id=purchase.purchase_id,
                )

        purchase = await self._purchase_repo.advance_status(
            purchase_id=purchase_id, new_status=new_status
        )

        history = PurchaseStatusHistory(
            purchase_id=purchase.purchase_id,
            from_status=from_status,
            to_status=new_status,
            changed_by_user_id=actor.user_id,
        )
        await self._purchase_repo.add_status_history(history)

        refreshed = await self._purchase_repo.get_by_id(purchase.purchase_id)
        return refreshed if refreshed is not None else purchase
