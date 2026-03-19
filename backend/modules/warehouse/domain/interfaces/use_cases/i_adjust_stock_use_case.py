from abc import ABC, abstractmethod

from modules.warehouse.domain.adjust_stock_result import AdjustStockResult


class IAdjustStockUseCase(ABC):
    """Contract for adjusting warehouse stock for a product."""

    @abstractmethod
    async def execute(
        self,
        warehouse_id: int,
        product_id: int,
        new_quantity: int,
        user_email: str,
        reason: str | None = None,
    ) -> AdjustStockResult: ...
