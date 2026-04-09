from abc import ABC, abstractmethod
from decimal import Decimal

from modules.purchases.domain.entities.purchase import Purchase


class IAddPurchaseLineUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        purchase_id: int,
        product_id: int,
        quantity: int,
        unit_price: Decimal,
        discount: Decimal,
    ) -> Purchase: ...
