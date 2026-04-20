from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from modules.suppliers.application.add_product_to_supplier_use_case import (
    AddProductToSupplierUseCase,
)
from modules.suppliers.application.update_supplier_product_price_use_case import (
    UpdateSupplierProductPriceUseCase,
)
from modules.suppliers.domain.dtos.supplier_product_detail import SupplierProductDetail
from modules.suppliers.domain.exceptions import SupplierException, SupplierExceptionInfo


def _detail(product_id: int, price: str) -> SupplierProductDetail:
    return SupplierProductDetail(
        product_id=product_id,
        product_name=f"Product {product_id}",
        product_code=f"CODE-{product_id}",
        category_name="Category",
        supplier_price=Decimal(price),
    )


@pytest.mark.asyncio
async def test_add_product_returns_enriched_detail():
    repo = MagicMock()
    product_reader = MagicMock()

    repo.get_by_id = AsyncMock(return_value=MagicMock(is_active=True))
    repo.get_association = AsyncMock(return_value=None)
    repo.add_product = AsyncMock(return_value=MagicMock())
    repo.get_product_by_supplier_detail = AsyncMock(return_value=_detail(10, "12.34"))
    product_reader.get_by_id = AsyncMock(return_value=MagicMock(is_active=True))

    use_case = AddProductToSupplierUseCase(repo, product_reader)

    result = await use_case.execute(1, 10, Decimal("12.34"))

    assert result.product_id == 10
    assert result.product_name == "Product 10"
    assert result.product_code == "CODE-10"
    assert result.category_name == "Category"
    assert result.supplier_price == Decimal("12.34")
    repo.add_product.assert_awaited_once_with(1, 10, Decimal("12.34"))
    repo.get_product_by_supplier_detail.assert_awaited_once_with(1, 10)


@pytest.mark.asyncio
async def test_add_product_raises_if_enriched_detail_missing():
    repo = MagicMock()
    product_reader = MagicMock()

    repo.get_by_id = AsyncMock(return_value=MagicMock(is_active=True))
    repo.get_association = AsyncMock(return_value=None)
    repo.add_product = AsyncMock(return_value=MagicMock())
    repo.get_product_by_supplier_detail = AsyncMock(return_value=None)
    product_reader.get_by_id = AsyncMock(return_value=MagicMock(is_active=True))

    use_case = AddProductToSupplierUseCase(repo, product_reader)

    with pytest.raises(SupplierException) as exc:
        await use_case.execute(1, 10, Decimal("12.34"))

    assert exc.value.info.code == SupplierExceptionInfo.ASSOCIATION_NOT_FOUND.code


@pytest.mark.asyncio
async def test_update_product_price_returns_enriched_detail():
    repo = MagicMock()
    repo.update_product_price = AsyncMock(return_value=MagicMock())
    repo.get_product_by_supplier_detail = AsyncMock(return_value=_detail(10, "55.00"))

    use_case = UpdateSupplierProductPriceUseCase(repo)

    result = await use_case.execute(1, 10, Decimal("55.00"))

    assert result.product_id == 10
    assert result.product_name == "Product 10"
    assert result.product_code == "CODE-10"
    assert result.category_name == "Category"
    assert result.supplier_price == Decimal("55.00")
    repo.update_product_price.assert_awaited_once_with(1, 10, Decimal("55.00"))
    repo.get_product_by_supplier_detail.assert_awaited_once_with(1, 10)
