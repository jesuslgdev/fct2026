from abc import ABC, abstractmethod

from modules.sales.domain.entities.sale import Sale


class IUpdateSaleUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        sale_id: int,
        client_id: int,
        delivery_address: str,
        lines: list[dict],
    ) -> Sale: ...
