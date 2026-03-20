from decimal import Decimal

from modules.catalog.domain.interfaces.repositories.i_product_repository import (
    IProductRepository,
)
from modules.purchases.domain.entities.purchase import Purchase
from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.purchases.domain.interfaces.use_cases.i_create_purchase_use_case import (
    ICreatePurchaseUseCase,
)
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)


class CreatePurchaseUseCase(ICreatePurchaseUseCase):
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
        supplier_id: int,
        user_id: int,
        warehouse_id: int,
        lines: list[dict],
    ) -> Purchase:
        supplier = await self._supplier_repo.get_by_id(supplier_id)
        if supplier is None:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)
        if not supplier.is_active:
            raise PurchaseException(PurchaseExceptionInfo.SUPPLIER_NOT_ACTIVE)

        processed_lines: list[dict] = []
        subtotal = Decimal("0")

        for line in lines:
            product = await self._product_repo.get_by_id(line["product_id"])
            if product is None:
                raise PurchaseException(PurchaseExceptionInfo.PRODUCT_NOT_FOUND)
            if not product.is_active:
                raise PurchaseException(PurchaseExceptionInfo.PRODUCT_NOT_ACTIVE)

            association = await self._supplier_repo.get_association(
                supplier_id, line["product_id"]
            )
            if association is None:
                raise PurchaseException(PurchaseExceptionInfo.PRODUCT_NOT_LINKED)

            quantity = line["quantity"]
            unit_price = Decimal(str(line["unit_price"]))
            discount = Decimal(str(line["discount"]))
            gross = quantity * unit_price

            if discount > gross:
                raise PurchaseException(PurchaseExceptionInfo.INVALID_DISCOUNT)

            line_subtotal = gross - discount
            subtotal += line_subtotal

            processed_lines.append(
                {
                    "product_id": line["product_id"],
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "discount": discount,
                    "line_subtotal": line_subtotal,
                }
            )

        taxes = subtotal * Decimal("0.21")
        total = subtotal + taxes

        purchase_number = await self._purchase_repo.generate_purchase_number()

        return await self._purchase_repo.create(
            purchase_number=purchase_number,
            supplier_id=supplier_id,
            user_id=user_id,
            warehouse_id=warehouse_id,
            status="Pending",
            subtotal=subtotal,
            taxes=taxes,
            total=total,
            lines=processed_lines,
        )
