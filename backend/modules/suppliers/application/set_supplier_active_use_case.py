from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from modules.suppliers.domain.interfaces.use_cases.i_set_supplier_active_use_case import (
    ISetSupplierActiveUseCase,
)


class SetSupplierActiveUseCase(ISetSupplierActiveUseCase):
    def __init__(self, repo: ISupplierRepository) -> None:
        self._repo = repo

    async def execute(self, supplier_id: int, is_active: bool) -> None:
        await self._repo.set_active(supplier_id, is_active)
