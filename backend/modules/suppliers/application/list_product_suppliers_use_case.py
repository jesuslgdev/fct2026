from modules.suppliers.domain.dtos.product_supplier_detail import (
    ProductSupplierDetail,
)
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from modules.suppliers.domain.interfaces.use_cases.i_list_product_suppliers_use_case import (
    IListProductSuppliersUseCase,
)
from shared.domain.dtos.paginated_result import PaginatedResult


class ListProductSuppliersUseCase(IListProductSuppliersUseCase):
    def __init__(self, repo: ISupplierRepository) -> None:
        self._repo = repo

    async def execute(
        self, product_id: int, page: int, page_size: int
    ) -> PaginatedResult[ProductSupplierDetail]:
        return await self._repo.get_suppliers_by_product_paginated(
            product_id, page, page_size
        )
