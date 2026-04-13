from datetime import datetime

from modules.sales.domain.interfaces.repositories.i_sale_repository import (
    ISaleRepository,
)
from modules.sales.domain.interfaces.use_cases.i_list_sales_use_case import (
    IListSalesUseCase,
)
from shared.domain.dtos.paginated_result import PaginatedResult


class ListSalesUseCase(IListSalesUseCase):
    def __init__(self, repo: ISaleRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        page: int,
        page_size: int,
        sort_field: str,
        sort_order: str,
        status: str | None,
        client_id: int | None,
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
            client_id=client_id,
            date_from=date_from,
            date_to=date_to,
            search=search,
        )
