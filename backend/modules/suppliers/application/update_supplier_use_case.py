from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from modules.suppliers.domain.interfaces.use_cases.i_update_supplier_use_case import (
    IUpdateSupplierUseCase,
)
from shared.domain.dtos.address import Address


class UpdateSupplierUseCase(IUpdateSupplierUseCase):
    def __init__(self, repo: ISupplierRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        supplier_id: int,
        name: str | None,
        address_data: Address | None,
        phone: str | None,
        email: str | None,
    ) -> Supplier:
        return await self._repo.update(supplier_id, name, address_data, phone, email)
