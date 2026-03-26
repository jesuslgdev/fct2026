from decimal import Decimal

from modules.suppliers.domain.entities.supplier_product import SupplierProduct
from modules.suppliers.domain.exceptions import SupplierException, SupplierExceptionInfo
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from modules.suppliers.domain.interfaces.use_cases.i_update_supplier_product_price_use_case import (
    IUpdateSupplierProductPriceUseCase,
)


class UpdateSupplierProductPriceUseCase(IUpdateSupplierProductPriceUseCase):
    def __init__(self, repo: ISupplierRepository) -> None:
        self._repo = repo

    async def execute(
        self, supplier_id: int, product_id: int, price: Decimal
    ) -> SupplierProduct:
        if price <= 0:
            raise SupplierException(SupplierExceptionInfo.INVALID_SUPPLIER_PRICE)

        return await self._repo.update_product_price(supplier_id, product_id, price)
