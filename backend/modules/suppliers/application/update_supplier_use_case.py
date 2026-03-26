from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from modules.suppliers.domain.interfaces.use_cases.i_update_supplier_use_case import (
    IUpdateSupplierUseCase,
)


class UpdateSupplierUseCase(IUpdateSupplierUseCase):
    def __init__(self, repo: ISupplierRepository) -> None:
        self._repo = repo

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
    ) -> Supplier:
        return await self._repo.update(
            supplier_id, name, address, city, province, postal_code, phone, email
        )
