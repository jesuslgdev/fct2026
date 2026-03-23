from modules.catalog.domain.interfaces.repositories.i_product_repository import (
    IProductRepository,
)
from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo
from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.purchases.domain.interfaces.use_cases.i_get_supplier_price_use_case import (
    IGetSupplierPriceUseCase,
)
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)


class GetSupplierPriceUseCase(IGetSupplierPriceUseCase):
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
    ) -> dict:
        purchase = await self._purchase_repo.get_by_id(purchase_id)
        if purchase is None:
            raise PurchaseException(PurchaseExceptionInfo.PURCHASE_NOT_FOUND)

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

        return {
            "product_id": product_id,
            "supplier_price": association.supplier_price,
        }
