from datetime import datetime

from modules.warehouse.domain.dtos.stock_movement_item import StockMovementItem
from modules.warehouse.domain.interfaces.repositories.i_stock_movement_repository import (
    IStockMovementRepository,
)
from modules.warehouse.domain.interfaces.use_cases.i_list_stock_movements_use_case import (
    IListStockMovementsUseCase,
)
from shared.domain.dtos.paginated_result import PaginatedResult


class ListStockMovementsUseCase(IListStockMovementsUseCase):
    """Return a paginated, filtered list of stock movement history."""

    def __init__(self, movement_repo: IStockMovementRepository) -> None:
        self._movement_repo = movement_repo

    async def execute(
        self,
        page: int,
        page_size: int,
        product_id: int | None,
        movement_type: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
        reason_search: str | None,
    ) -> PaginatedResult[StockMovementItem]:
        rows, total = await self._movement_repo.list_by_filters(
            product_id=product_id,
            movement_type=movement_type,
            date_from=date_from,
            date_to=date_to,
            reason_search=reason_search,
            page=page,
            page_size=page_size,
        )
        items = [
            StockMovementItem(
                movement_id=movement.movement_id,
                product_id=movement.product_id,
                product_name=product_name,
                movement_type=movement.movement_type,
                difference=movement.difference,
                reason=movement.reason,
                purchase_id=movement.purchase_id,
                sale_id=movement.sale_id,
                created_at=movement.created_at,
            )
            for movement, product_name in rows
        ]
        return PaginatedResult(items=items, total=total, page=page, page_size=page_size)
