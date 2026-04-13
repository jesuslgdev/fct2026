from abc import ABC, abstractmethod

from modules.suppliers.domain.entities.supplier import Supplier
from shared.domain.dtos.address import Address


class ICreateSupplierUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        name: str,
        tax_id: str,
        address_data: Address,
        phone: str,
        email: str,
    ) -> Supplier: ...
