import re
import unicodedata
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

        # 2. Generate next product code from category prefix (ABC-XXX)
        prefix = _build_category_prefix(category.name)
        product_code = await self._generate_next_product_code(prefix)

        # 3. Persist via repository
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


def _build_category_prefix(category_name: str) -> str:
    normalized_name = unicodedata.normalize("NFKD", category_name or "")
    ascii_name = normalized_name.encode("ascii", "ignore").decode("ascii")
    letters = re.sub(r"[^A-Za-z0-9]", "", ascii_name).upper()
    return (letters[:3] or "PRD").ljust(3, "X")
