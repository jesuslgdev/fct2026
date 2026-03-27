from modules.catalog.domain.interfaces.repositories.i_product_repository import (
    IProductRepository,
)
from modules.catalog.domain.interfaces.use_cases.products.i_set_product_active_use_case import (
    ISetProductActiveUseCase,
)


class SetProductActiveUseCase(ISetProductActiveUseCase):
    def __init__(self, repo: IProductRepository) -> None:
        self._repo = repo

    async def execute(self, product_id: int, is_active: bool) -> None:
        await self._repo.set_active(product_id, is_active)
