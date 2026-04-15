from abc import ABC, abstractmethod


class IStockEntryRecorder(ABC):
    """Cross-module contract for recording stock inbound entries.

    Implemented by the warehouse module, consumed by the purchases module
    when a purchase is marked as Received.
    """

    @abstractmethod
    async def add_stock(
        self,
        warehouse_id: int,
        product_id: int,
        quantity: int,
        user_email: str,
        reason: str,
    ) -> None: ...
