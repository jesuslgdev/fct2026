from abc import ABC, abstractmethod

from modules.sales.domain.entities.sale import Sale


class IGetSaleUseCase(ABC):
    @abstractmethod
    async def execute(self, sale_id: int) -> Sale: ...
