from modules.purchases.domain.entities.purchase import Purchase
from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.purchases.domain.interfaces.use_cases.i_advance_purchase_status_use_case import (
    IAdvancePurchaseStatusUseCase,
)
from shared.domain.interfaces.i_stock_entry_recorder import IStockEntryRecorder

VALID_TRANSITIONS: dict[str, set[str]] = {
    "Pending": {"Approved"},
    "Approved": {"In Process"},
    "In Process": {"Sent"},
    "Sent": {"Received"},
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
        self, purchase_id: int, new_status: str, user_email: str
    ) -> Purchase:
        purchase = await self._purchase_repo.get_by_id(purchase_id)
        if purchase is None:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)

        if new_status not in VALID_TRANSITIONS.get(purchase.status, set()):
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_INVALID_TRANSITION)

        if new_status == "Received":
            reason = f"Purchase received: {purchase.purchase_number}"
            for line in purchase.lines:
                await self._stock_recorder.add_stock(
                    warehouse_id=purchase.warehouse_id,
                    product_id=line.product_id,
                    quantity=line.quantity,
                    user_email=user_email,
                    reason=reason,
                )

        return await self._purchase_repo.advance_status(purchase_id, new_status)
