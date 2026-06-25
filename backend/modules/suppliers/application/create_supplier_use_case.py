import re

from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.exceptions import SupplierException, SupplierExceptionInfo
from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from modules.suppliers.domain.interfaces.use_cases.i_create_supplier_use_case import (
    ICreateSupplierUseCase,
)
from shared.constants import TAX_ID_PATTERN
from shared.domain.dtos.address import Address


class CreateSupplierUseCase(ICreateSupplierUseCase):
    def __init__(self, repo: ISupplierRepository) -> None:
        self._repo = repo

    async def execute(
        self,
        name: str,
        tax_id: str,
        address_data: Address,
        phone: str,
        email: str,
    ) -> Supplier:
        normalized_tax_id = tax_id.upper()

        if not re.match(TAX_ID_PATTERN, normalized_tax_id):
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_INVALID_TAX_ID)

        existing = await self._repo.get_by_tax_id(normalized_tax_id)
        if existing is not None:
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_ALREADY_EXISTS)

        existing_email = await self._repo.get_by_email(email)
        if existing_email is not None:
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_EMAIL_ALREADY_EXISTS)

        return await self._repo.create(
            name=name,
            tax_id=normalized_tax_id,
            address_data=address_data,
            phone=phone,
            email=email,
        )
