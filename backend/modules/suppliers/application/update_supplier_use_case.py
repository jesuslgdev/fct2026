from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.exceptions import SupplierException, SupplierExceptionInfo
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
        supplier = await self._repo.get_by_id(supplier_id)
        if supplier is None:
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_NOT_FOUND)

        if email is not None and email != supplier.email:
            existing = await self._repo.get_by_email(email)
            if existing is not None:
                raise SupplierException(SupplierExceptionInfo.SUPPLIER_EMAIL_ALREADY_EXISTS)

        return await self._repo.update(supplier_id, name, address_data, phone, email)
