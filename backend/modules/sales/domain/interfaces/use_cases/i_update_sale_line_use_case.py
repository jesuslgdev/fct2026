from abc import ABC, abstractmethod
from decimal import Decimal

from modules.sales.domain.entities.sale import Sale


class IUpdateSaleLineUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        sale_id: int,
        sale_line_id: int,
        quantity: int,
        discount: Decimal,
        discount_type: str,
    ) -> Sale: ...
