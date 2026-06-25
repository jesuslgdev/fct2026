from abc import ABC, abstractmethod

from modules.purchases.domain.entities.purchase import Purchase
from shared.domain.dtos.user_session import UserSession


class IAdvancePurchaseStatusUseCase(ABC):
    @abstractmethod
    async def execute(
        self, purchase_id: int, new_status: str, actor: UserSession
    ) -> Purchase: ...
