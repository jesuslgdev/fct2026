from abc import ABC, abstractmethod

from modules.purchases.domain.entities.purchase import Purchase


class IUpdatePurchaseUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        purchase_id: int,
        supplier_id: int,
        warehouse_id: int,
    ) -> Purchase: ...
