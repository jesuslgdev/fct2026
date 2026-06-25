from abc import ABC, abstractmethod
from decimal import Decimal

from modules.suppliers.domain.dtos.supplier_product_detail import SupplierProductDetail


class IUpdateSupplierProductPriceUseCase(ABC):
    @abstractmethod
    async def execute(
        self, supplier_id: int, product_id: int, price: Decimal
    ) -> SupplierProductDetail: ...
