from abc import ABC, abstractmethod

from modules.suppliers.domain.entities.supplier import Supplier


class ICreateSupplierUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        name: str,
        tax_id: str,
        address: str,
        city: str,
        province: str,
        postal_code: str,
        phone: str,
        email: str,
    ) -> Supplier: ...
