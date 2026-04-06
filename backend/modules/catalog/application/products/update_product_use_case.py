from decimal import Decimal

from modules.catalog.domain.entities.product import Product
from modules.catalog.domain.exceptions import CatalogException, CatalogExceptionInfo
from modules.catalog.domain.interfaces.repositories.i_category_repository import (
    ICategoryRepository,
)
from modules.catalog.domain.interfaces.repositories.i_product_repository import (
    IProductRepository,
)
from modules.catalog.domain.interfaces.use_cases.products.i_update_product_use_case import (
    IUpdateProductUseCase,
)


class UpdateProductUseCase(IUpdateProductUseCase):
    def __init__(
        self, product_repo: IProductRepository, category_repo: ICategoryRepository
    ) -> None:
        self._product_repo = product_repo
        self._category_repo = category_repo

    async def execute(
        self,
        product_id: int,
        product_code: str | None = None,
        name: str | None = None,
        description: str | None = None,
        category_id: int | None = None,
        price: Decimal | None = None,
        vat_rate: Decimal | None = None,
        stock_min: int | None = None,
    ) -> Product:
        # 1. Validate category if provided
        if category_id is not None:
            category = await self._category_repo.get_by_id(category_id)
            if category is None:
                raise CatalogException(CatalogExceptionInfo.CATEGORY_NOT_FOUND)

        # 2. Validate product code uniqueness if provided
        if product_code is not None:
            existing = await self._product_repo.get_by_code(product_code)
            if existing and existing.product_id != product_id:
                raise CatalogException(CatalogExceptionInfo.PRODUCT_CODE_ALREADY_EXISTS)

        # 3. Update via repo (repo handles not found)
        return await self._product_repo.update(
            product_id=product_id,
            product_code=product_code,
            name=name,
            description=description,
            category_id=category_id,
            price=price,
            vat_rate=vat_rate,
            stock_min=stock_min,
        )
