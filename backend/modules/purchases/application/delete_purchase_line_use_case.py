from decimal import Decimal

from modules.purchases.domain.entities.purchase import Purchase
from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.purchases.domain.interfaces.use_cases.i_delete_purchase_line_use_case import (
    IDeletePurchaseLineUseCase,
)


class DeletePurchaseLineUseCase(IDeletePurchaseLineUseCase):
    def __init__(self, purchase_repo: IPurchaseRepository) -> None:
        self._purchase_repo = purchase_repo

    async def execute(
        self,
        purchase_id: int,
        purchase_line_id: int,
    ) -> Purchase:
        purchase = await self._purchase_repo.get_by_id(purchase_id)
        if purchase is None:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)
        if purchase.status != "Pending":
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_PENDING)

        line = await self._purchase_repo.get_line_by_id(purchase_line_id)
        if line is None or line.purchase_id != purchase_id:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_LINE_NOT_FOUND)

        if len(purchase.lines) <= 1:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NO_LINES)

        await self._purchase_repo.delete_line(purchase_line_id)

        updated = await self._purchase_repo.get_by_id(purchase_id)
        subtotal = sum(line.line_subtotal for line in updated.lines)
        taxes = subtotal * Decimal("0.21")
        total = subtotal + taxes

        return await self._purchase_repo.update_totals(
            purchase_id=purchase_id,
            subtotal=subtotal,
            taxes=taxes,
            total=total,
        )
