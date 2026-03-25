from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.purchases.domain.interfaces.use_cases.i_get_supplier_price_use_case import (
    IGetSupplierPriceUseCase,
)
from shared.domain.interfaces.i_product_reader import IProductReader
from shared.domain.interfaces.i_supplier_reader import ISupplierReader


class GetSupplierPriceUseCase(IGetSupplierPriceUseCase):
    def __init__(
        self,
        purchase_repo: IPurchaseRepository,
        supplier_reader: ISupplierReader,
        product_reader: IProductReader,
    ) -> None:
        self._purchase_repo = purchase_repo
        self._supplier_reader = supplier_reader
        self._product_reader = product_reader

    async def execute(
        self,
        purchase_id: int,
        product_id: int,
    ) -> dict:
        purchase = await self._purchase_repo.get_by_id(purchase_id)
        if purchase is None:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)

        product = await self._product_reader.get_by_id(product_id)
        if product is None:
            raise PurchaseException(PurchaseExceptionInfo.PRODUCT_NOT_FOUND)
        if not product.is_active:
            raise PurchaseException(PurchaseExceptionInfo.PRODUCT_NOT_ACTIVE)

        association = await self._supplier_reader.get_association(
            purchase.supplier_id, product_id
        )
        if association is None:
            raise PurchaseException(PurchaseExceptionInfo.PRODUCT_NOT_LINKED)

        return {
            "product_id": product_id,
            "supplier_price": association.supplier_price,
        }
