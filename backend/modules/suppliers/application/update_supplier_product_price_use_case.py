from decimal import Decimal

from modules.suppliers.domain.dtos.supplier_product_detail import SupplierProductDetail
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
    ) -> SupplierProductDetail:
        if price <= 0:
            raise SupplierException(SupplierExceptionInfo.INVALID_SUPPLIER_PRICE)

        await self._repo.update_product_price(supplier_id, product_id, price)
        detail = await self._repo.get_product_by_supplier_detail(
            supplier_id, product_id
        )
        if detail is None:
            raise SupplierException(SupplierExceptionInfo.ASSOCIATION_NOT_FOUND)
        return detail
