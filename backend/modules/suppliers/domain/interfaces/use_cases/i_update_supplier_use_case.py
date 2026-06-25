from abc import ABC, abstractmethod

from modules.suppliers.domain.entities.supplier import Supplier
from shared.domain.dtos.address import Address


class IUpdateSupplierUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        supplier_id: int,
        name: str | None,
        address_data: Address | None,
        phone: str | None,
        email: str | None,
    ) -> Supplier: ...
