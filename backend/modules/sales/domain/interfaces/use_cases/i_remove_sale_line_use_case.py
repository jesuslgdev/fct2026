from abc import ABC, abstractmethod

from modules.sales.domain.entities.sale import Sale


class IRemoveSaleLineUseCase(ABC):
    @abstractmethod
    async def execute(self, sale_id: int, sale_line_id: int) -> Sale: ...
