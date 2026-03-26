from datetime import datetime

from modules.purchases.domain.interfaces.repositories.i_purchase_repository import (
    IPurchaseRepository,
)
from modules.purchases.domain.interfaces.use_cases.i_list_purchases_use_case import (
    IListPurchasesUseCase,
)
from shared.domain.dtos.paginated_result import PaginatedResult


class ListPurchasesUseCase(IListPurchasesUseCase):
    def __init__(self, repo: IPurchaseRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        page: int,
        page_size: int,
        sort_field: str,
        sort_order: str,
        status: str | None,
        supplier_id: int | None,
        date_from: datetime | None,
        date_to: datetime | None,
        search: str | None = None,
    ) -> PaginatedResult:
        return await self._repo.get_all_paginated(
            page=page,
            page_size=page_size,
            sort_field=sort_field,
            sort_order=sort_order,
            status=status,
            supplier_id=supplier_id,
            date_from=date_from,
            date_to=date_to,
            search=search,
        )
