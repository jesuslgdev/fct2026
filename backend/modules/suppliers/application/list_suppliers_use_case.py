from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from modules.suppliers.domain.interfaces.use_cases.i_list_suppliers_use_case import (
    IListSuppliersUseCase,
)
from shared.domain.dtos.paginated_result import PaginatedResult


class ListSuppliersUseCase(IListSuppliersUseCase):
    def __init__(self, repo: ISupplierRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        active: bool | None = None,
    ) -> PaginatedResult[Supplier]:
        return await self._repo.get_all_paginated(
            page, page_size, search=search, active=active
        )
