from decimal import Decimal

from modules.suppliers.domain.dtos.supplier_product_detail import SupplierProductDetail
from modules.suppliers.domain.exceptions import SupplierException, SupplierExceptionInfo
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from modules.suppliers.domain.interfaces.use_cases.i_add_product_to_supplier_use_case import (
    IAddProductToSupplierUseCase,
)
from shared.domain.interfaces.i_product_reader import IProductReader


class AddProductToSupplierUseCase(IAddProductToSupplierUseCase):
    def __init__(
        self, repo: ISupplierRepository, product_reader: IProductReader
    ) -> None:
        self._repo = repo
        self._product_reader = product_reader

    async def execute(
        self, supplier_id: int, product_id: int, price: Decimal
    ) -> SupplierProductDetail:
        if price <= 0:
            raise SupplierException(SupplierExceptionInfo.INVALID_SUPPLIER_PRICE)

        # 1. Check supplier exists and is active
        supplier = await self._repo.get_by_id(supplier_id)
        if supplier is None:
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_NOT_FOUND)
        if not supplier.is_active:
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_NOT_ACTIVE)

        # 2. Check product exists and is active
        product = await self._product_reader.get_by_id(product_id)
        if product is None:
            raise SupplierException(SupplierExceptionInfo.PRODUCT_NOT_FOUND)
        if not product.is_active:
            raise SupplierException(SupplierExceptionInfo.PRODUCT_NOT_ACTIVE)

        # 3. Check association doesn't exist
        existing = await self._repo.get_association(supplier_id, product_id)
        if existing:
            raise SupplierException(SupplierExceptionInfo.ASSOCIATION_ALREADY_EXISTS)

        await self._repo.add_product(supplier_id, product_id, price)
        detail = await self._repo.get_product_by_supplier_detail(
            supplier_id, product_id
        )
        if detail is None:
            raise SupplierException(SupplierExceptionInfo.ASSOCIATION_NOT_FOUND)
        return detail
