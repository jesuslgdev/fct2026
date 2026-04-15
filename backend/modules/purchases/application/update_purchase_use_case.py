from decimal import Decimal

from modules.purchases.domain.entities.purchase import Purchase
from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.purchases.domain.interfaces.use_cases.i_update_purchase_use_case import (
    IUpdatePurchaseUseCase,
)
from shared.domain.interfaces.i_supplier_reader import ISupplierReader


class UpdatePurchaseUseCase(IUpdatePurchaseUseCase):
    def __init__(
        self,
        purchase_repo: IPurchaseRepository,
        supplier_reader: ISupplierReader,
    ) -> None:
        self._purchase_repo = purchase_repo
        self._supplier_reader = supplier_reader

    async def execute(
        self,
        purchase_id: int,
        supplier_id: int,
        warehouse_id: int,
    ) -> Purchase:
        purchase = await self._purchase_repo.get_by_id(purchase_id)
        if purchase is None:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)
        if purchase.status != "Pending":
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_PENDING)

        supplier = await self._supplier_reader.get_by_id(supplier_id)
        if supplier is None:
            raise PurchaseException(PurchaseExceptionInfo.SUPPLIER_NOT_FOUND)
        if not supplier.is_active:
            raise PurchaseException(PurchaseExceptionInfo.SUPPLIER_NOT_ACTIVE)

        if purchase.supplier_id != supplier_id:
            await self._purchase_repo.delete_all_lines(purchase_id)
            await self._purchase_repo.update_totals(
                purchase_id, Decimal("0"), Decimal("0"), Decimal("0")
            )

        return await self._purchase_repo.update_header(
            purchase_id, supplier_id, warehouse_id
        )
