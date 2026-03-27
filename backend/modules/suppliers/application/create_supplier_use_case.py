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


class CreateSupplierUseCase(ICreateSupplierUseCase):
    def __init__(self, repo: ISupplierRepository) -> None:
        self._repo = repo

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
    ) -> Supplier:
        normalized_tax_id = tax_id.upper()

        if not re.match(TAX_ID_PATTERN, normalized_tax_id):
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_INVALID_TAX_ID)

        existing = await self._repo.get_by_tax_id(normalized_tax_id)
        if existing is not None:
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_ALREADY_EXISTS)

        return await self._repo.create(
            name=name,
            tax_id=normalized_tax_id,
            address=address,
            city=city,
            province=province,
            postal_code=postal_code,
            phone=phone,
            email=email,
        )
