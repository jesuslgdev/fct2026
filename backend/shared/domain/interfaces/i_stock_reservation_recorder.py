from abc import ABC, abstractmethod


class IStockReservationRecorder(ABC):
    """Cross-module contract for reserving and releasing stock commitments.

    Implemented by the warehouse module, consumed by the sales module when a
    sale is approved (reserve) or cancelled/reverted (release).
    """

    @abstractmethod
    async def reserve(
        self,
        warehouse_id: int,
        product_id: int,
        quantity: int,
        user_email: str,
        reason: str,
    ) -> None: ...

    @abstractmethod
    async def release(
        self,
        warehouse_id: int,
        product_id: int,
        quantity: int,
        user_email: str,
        reason: str,
    ) -> None: ...
