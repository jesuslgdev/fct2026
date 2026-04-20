from io import BytesIO
from unittest.mock import AsyncMock, MagicMock

import pytest
from openpyxl import Workbook

from modules.suppliers.application.import_supplier_products_use_case import (
    EXPECTED_HEADERS,
    OPTIONAL_HEADER,
    ImportSupplierProductsUseCase,
)


def _make_xlsx(headers: list[str], rows: list[list]) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buffer = BytesIO()
    wb.save(buffer)
    wb.close()
    return buffer.getvalue()


@pytest.mark.asyncio
async def test_import_accepts_optional_product_name_header():
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=MagicMock(is_active=True))
    repo.get_association = AsyncMock(return_value=None)
    repo.bulk_create_products = AsyncMock(return_value=1)

    product_reader = MagicMock()
    product_reader.get_by_code = AsyncMock(
        return_value=MagicMock(product_id=10, is_active=True)
    )

    use_case = ImportSupplierProductsUseCase(repo, product_reader)
    content = _make_xlsx(
        [*EXPECTED_HEADERS, OPTIONAL_HEADER],
        [["PROD-001", "12.50", "Producto 1"]],
    )

    result = await use_case.execute(1, content)

    assert result.total == 1
    assert result.created == 1
    assert result.errors == []
    product_reader.get_by_code.assert_awaited_once_with("PROD-001")
    repo.bulk_create_products.assert_awaited_once()


@pytest.mark.asyncio
async def test_import_rejects_unknown_extra_header():
    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=MagicMock(is_active=True))
    repo.get_association = AsyncMock(return_value=None)
    repo.bulk_create_products = AsyncMock(return_value=0)

    product_reader = MagicMock()
    product_reader.get_by_code = AsyncMock(return_value=None)

    use_case = ImportSupplierProductsUseCase(repo, product_reader)
    content = _make_xlsx(
        [*EXPECTED_HEADERS, "Header desconocido"],
        [["PROD-001", "12.50", "Producto 1"]],
    )

    result = await use_case.execute(1, content)

    assert result.total == 0
    assert result.created == 0
    assert len(result.errors) == 1
    assert result.errors[0].row == 1
    assert result.errors[0].reason == "Invalid headers. Use the provided template"
