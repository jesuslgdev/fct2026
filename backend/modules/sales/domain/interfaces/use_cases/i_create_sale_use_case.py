from abc import ABC, abstractmethod

from modules.sales.domain.entities.sale import Sale


class ICreateSaleUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        client_id: int,
        warehouse_id: int,
        user_id: int,
        lines: list[dict],
    ) -> Sale: ...
