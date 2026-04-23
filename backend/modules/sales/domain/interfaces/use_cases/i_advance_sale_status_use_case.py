from abc import ABC, abstractmethod

from modules.sales.domain.entities.sale import Sale
from shared.domain.dtos.user_session import UserSession


class IAdvanceSaleStatusUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        sale_id: int,
        new_status: str,
        actor: UserSession,
    ) -> Sale: ...
