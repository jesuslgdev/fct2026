from modules.catalog.domain.entities.product import Product
from modules.catalog.domain.interfaces.repositories.i_product_repository import (
    IProductRepository,
)
from modules.catalog.domain.interfaces.use_cases.products.i_list_products_use_case import (
    IListProductsUseCase,
)
from shared.domain.paginated_result import PaginatedResult


class ListProductsUseCase(IListProductsUseCase):
    def __init__(self, repo: IProductRepository) -> None:
        self._repo = repo

    async def execute(
        self, page: int, page_size: int, category_id: int | None = None
    ) -> PaginatedResult[Product]:
        return await self._repo.get_all_paginated(page, page_size, category_id)
