from modules.catalog.domain.entities.product import Product
from modules.catalog.domain.exceptions import CatalogException, CatalogExceptionInfo
from modules.catalog.domain.interfaces.repositories.i_product_repository import (
    IProductRepository,
)
from modules.catalog.domain.interfaces.use_cases.products.i_get_product_use_case import (
    IGetProductUseCase,
)


class GetProductUseCase(IGetProductUseCase):
    def __init__(self, repo: IProductRepository) -> None:
        self._repo = repo

    async def execute(self, product_id: int) -> Product:
        product = await self._repo.get_by_id(product_id)
        if product is None:
            raise CatalogException(CatalogExceptionInfo.PRODUCT_NOT_FOUND)
        return product
