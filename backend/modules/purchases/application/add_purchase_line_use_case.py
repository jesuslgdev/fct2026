from decimal import Decimal

from modules.catalog.domain.interfaces.repositories.i_product_repository import (
    IProductRepository,
)
from modules.purchases.domain.entities.purchase import Purchase
from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.purchases.domain.interfaces.use_cases.i_add_purchase_line_use_case import (
    IAddPurchaseLineUseCase,
)
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)


class AddPurchaseLineUseCase(IAddPurchaseLineUseCase):
    def __init__(
        self,
        purchase_repo: IPurchaseRepository,
        supplier_repo: ISupplierRepository,
        product_repo: IProductRepository,
    ) -> None:
        self._purchase_repo = purchase_repo
        self._supplier_repo = supplier_repo
        self._product_repo = product_repo

    async def execute(
        self,
        purchase_id: int,
        product_id: int,
        quantity: int,
        unit_price: Decimal,
        discount: Decimal,
    ) -> Purchase:
        purchase = await self._purchase_repo.get_by_id(purchase_id)
        if purchase is None:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)
        if purchase.status != "Pending":
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_PENDING)

        product = await self._product_repo.get_by_id(product_id)
        if product is None:
            raise PurchaseException(PurchaseExceptionInfo.PRODUCT_NOT_FOUND)
        if not product.is_active:
            raise PurchaseException(PurchaseExceptionInfo.PRODUCT_NOT_ACTIVE)

        association = await self._supplier_repo.get_association(
            purchase.supplier_id, product_id
        )
        if association is None:
            raise PurchaseException(PurchaseExceptionInfo.PRODUCT_NOT_LINKED)

        gross = quantity * unit_price
        if discount > gross:
            raise PurchaseException(PurchaseExceptionInfo.INVALID_DISCOUNT)

        line_subtotal = gross - discount

        await self._purchase_repo.add_line(
            purchase_id=purchase_id,
            product_id=product_id,
            quantity=quantity,
            unit_price=unit_price,
            discount=discount,
            line_subtotal=line_subtotal,
        )

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
