from abc import ABC, abstractmethod
from decimal import Decimal

from modules.suppliers.domain.entities.supplier_product import SupplierProduct


class IAddProductToSupplierUseCase(ABC):
    @abstractmethod
    async def execute(
        self, supplier_id: int, product_id: int, price: Decimal
    ) -> SupplierProduct: ...
