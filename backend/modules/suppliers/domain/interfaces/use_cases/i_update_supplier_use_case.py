from abc import ABC, abstractmethod

from modules.suppliers.domain.entities.supplier import Supplier


class IUpdateSupplierUseCase(ABC):
    @abstractmethod
    async def execute(
        self,
        supplier_id: int,
        name: str | None,
        address: str | None,
        city: str | None,
        province: str | None,
        postal_code: str | None,
        phone: str | None,
        email: str | None,
    ) -> Supplier: ...
