from abc import ABC, abstractmethod

from modules.suppliers.domain.entities.supplier_product_detail import (
    SupplierProductDetail,
)
from shared.domain.paginated_result import PaginatedResult


class IListSupplierProductsUseCase(ABC):
    @abstractmethod
    async def execute(
        self, supplier_id: int, page: int, page_size: int
    ) -> PaginatedResult[SupplierProductDetail]: ...
