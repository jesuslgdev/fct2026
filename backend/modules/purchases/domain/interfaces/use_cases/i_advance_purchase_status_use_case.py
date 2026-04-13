from abc import ABC, abstractmethod

from modules.purchases.domain.entities.purchase import Purchase


class IAdvancePurchaseStatusUseCase(ABC):
    @abstractmethod
    async def execute(
        self, purchase_id: int, new_status: str, user_email: str
    ) -> Purchase: ...
