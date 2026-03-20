from modules.warehouse.domain.interfaces.repositories.i_warehouse_stock_repository import (
    IWarehouseStockRepository,
)
from modules.warehouse.domain.interfaces.use_cases.i_list_stock_distribution_use_case import (
    IListStockDistributionUseCase,
)
from modules.warehouse.domain.stock_distribution import StockDistributionItem
from shared.domain.paginated_result import PaginatedResult


class ListStockDistributionUseCase(IListStockDistributionUseCase):
    """List paginated stock distribution across warehouses and products."""

    def __init__(self, stock_repo: IWarehouseStockRepository) -> None:
        self._stock_repo = stock_repo

    async def execute(
        self,
        page: int,
        page_size: int,
        warehouse_id: int | None = None,
        product_id: int | None = None,
    ) -> PaginatedResult[StockDistributionItem]:
        return await self._stock_repo.list_distribution(
            page, page_size, warehouse_id, product_id
        )
