from abc import ABC, abstractmethod

from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.entities.supplier_product_detail import (
    SupplierProductDetail,
)


class IGetSupplierUseCase(ABC):
    @abstractmethod
    async def execute(
        self, supplier_id: int
    ) -> tuple[Supplier, list[SupplierProductDetail]]: ...
