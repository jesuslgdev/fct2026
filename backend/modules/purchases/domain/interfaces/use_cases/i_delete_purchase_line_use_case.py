from abc import ABC, abstractmethod

from modules.purchases.domain.entities.purchase import Purchase


class IDeletePurchaseLineUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        purchase_id: int,
        purchase_line_id: int,
    ) -> Purchase: ...
