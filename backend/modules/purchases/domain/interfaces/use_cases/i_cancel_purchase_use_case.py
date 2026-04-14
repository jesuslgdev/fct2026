from abc import ABC, abstractmethod

from modules.purchases.domain.entities.purchase import Purchase


class ICancelPurchaseUseCase(ABC):
    @abstractmethod
    async def execute(self, purchase_id: int, user_id: int) -> Purchase: ...
