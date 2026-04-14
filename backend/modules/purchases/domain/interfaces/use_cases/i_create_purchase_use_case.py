from abc import ABC, abstractmethod

from modules.purchases.domain.entities.purchase import Purchase


class ICreatePurchaseUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        supplier_id: int,
        user_id: int,
        warehouse_id: int,
        lines: list[dict],
    ) -> Purchase: ...
