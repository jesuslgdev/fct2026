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
    PRODUCT_CODE_PREFIX = "PROD"

    def __init__(
        self, product_repo: IProductRepository, category_repo: ICategoryRepository
    ) -> None:
        self._product_repo = product_repo
        self._category_repo = category_repo

    async def execute(
        self,
        name: str,
        description: str | None,
        category_id: int,
        price: Decimal,
        vat_rate: Decimal,
        stock_min: int,
    ) -> Product:
        # 1. Validate category exists
        category = await self._category_repo.get_by_id(category_id)
        if category is None:
            raise CatalogException(CatalogExceptionInfo.CATEGORY_NOT_FOUND)

        # 2. Validate name uniqueness
        existing_name = await self._product_repo.get_by_name(name)
        if existing_name:
            raise CatalogException(CatalogExceptionInfo.PRODUCT_NAME_ALREADY_EXISTS)

        # 3. Generate next product code with fixed prefix (PROD-XXX)
        product_code = await self._generate_next_product_code(self.PRODUCT_CODE_PREFIX)

        # 4. Persist via repository
        return await self._product_repo.create(
            product_code=product_code,
            name=name,
            description=description,
            category_id=category_id,
            price=price,
            vat_rate=vat_rate,
            stock_min=stock_min,
        )

    async def _generate_next_product_code(self, prefix: str) -> str:
        sequence = 1
        while True:
            candidate = f"{prefix}-{sequence:03d}"
            existing = await self._product_repo.get_by_code(candidate)
            if existing is None:
                return candidate
            sequence += 1
