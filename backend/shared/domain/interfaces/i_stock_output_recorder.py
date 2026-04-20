from abc import ABC, abstractmethod


class IStockOutputRecorder(ABC):
    """Cross-module contract for recording stock outbound movements.

    Implemented by the warehouse module, consumed by the sales module
    when a sale is marked as Delivered.
    """

    @abstractmethod
    async def remove_stock(
        self,
        warehouse_id: int,
        product_id: int,
        quantity: int,
        user_email: str,
        reason: str,
    ) -> None: ...
