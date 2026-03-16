from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.entities.supplier_product import SupplierProduct
from modules.suppliers.domain.exceptions import SupplierException, SupplierExceptionInfo
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from modules.suppliers.domain.interfaces.use_cases.i_get_supplier_use_case import (
    IGetSupplierUseCase,
)


class GetSupplierUseCase(IGetSupplierUseCase):
    def __init__(self, repo: ISupplierRepository) -> None:
        self._repo = repo

    async def execute(self, supplier_id: int) -> tuple[Supplier, list[SupplierProduct]]:
        supplier = await self._repo.get_by_id(supplier_id)
        if supplier is None:
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_NOT_FOUND)
        products = await self._repo.get_products_by_supplier(supplier_id)
        return supplier, products
