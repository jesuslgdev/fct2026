from decimal import Decimal

from modules.catalog.domain.entities.product import Product
from modules.catalog.domain.exceptions import CatalogException, CatalogExceptionInfo
from modules.catalog.domain.interfaces.repositories.i_category_repository import (
    ICategoryRepository,
)
from modules.catalog.domain.interfaces.repositories.i_product_repository import (
    IProductRepository,
)
from modules.catalog.domain.interfaces.use_cases.products.i_create_product_use_case import (
    ICreateProductUseCase,
)


class CreateProductUseCase(ICreateProductUseCase):
    def __init__(
        self, product_repo: IProductRepository, category_repo: ICategoryRepository
    ) -> None:
        self._product_repo = product_repo
        self._category_repo = category_repo

    async def execute(
        self,
        product_code: str,
        name: str,
        description: str | None,
        category_id: int,
        price: Decimal,
        vat_rate: Decimal,
        stock_current: int,
        stock_min: int,
    ) -> Product:
        # 1. Validate category exists
        category = await self._category_repo.get_by_id(category_id)
        if category is None:
            raise CatalogException(CatalogExceptionInfo.CATEGORY_NOT_FOUND)

        # 2. Validate product code uniqueness
        existing = await self._product_repo.get_by_code(product_code)
        if existing:
            raise CatalogException(CatalogExceptionInfo.PRODUCT_CODE_ALREADY_EXISTS)

        # 3. Persist via repository
        return await self._product_repo.create(
            product_code=product_code,
            name=name,
            description=description,
            category_id=category_id,
            price=price,
            vat_rate=vat_rate,
            stock_current=stock_current,
            stock_min=stock_min,
        )
