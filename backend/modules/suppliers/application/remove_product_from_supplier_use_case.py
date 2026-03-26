from modules.suppliers.domain.interfaces.repositories.i_supplier_repository import (
    ISupplierRepository,
)
from modules.suppliers.domain.interfaces.use_cases.i_remove_product_from_supplier_use_case import (
    IRemoveProductFromSupplierUseCase,
)


class RemoveProductFromSupplierUseCase(IRemoveProductFromSupplierUseCase):
    def __init__(self, repo: ISupplierRepository) -> None:
        self._repo = repo

    async def execute(self, supplier_id: int, product_id: int) -> None:
        await self._repo.remove_product(supplier_id, product_id)
