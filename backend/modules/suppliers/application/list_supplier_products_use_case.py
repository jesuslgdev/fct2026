from modules.suppliers.domain.entities.supplier_product_detail import (
    SupplierProductDetail,
)
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from modules.suppliers.domain.interfaces.use_cases.i_list_supplier_products_use_case import (
    IListSupplierProductsUseCase,
)
from shared.domain.paginated_result import PaginatedResult


class ListSupplierProductsUseCase(IListSupplierProductsUseCase):
    def __init__(self, repo: ISupplierRepository) -> None:
        self._repo = repo

    async def execute(
        self, supplier_id: int, page: int, page_size: int
    ) -> PaginatedResult[SupplierProductDetail]:
        return await self._repo.get_products_by_supplier_paginated(
            supplier_id, page, page_size
        )
