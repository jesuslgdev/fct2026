from abc import ABC, abstractmethod
from decimal import Decimal

from modules.sales.domain.entities.sale import Sale


class IAddSaleLineUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        sale_id: int,
        product_id: int,
        quantity: int,
        discount: Decimal,
        discount_type: str,
    ) -> Sale: ...
