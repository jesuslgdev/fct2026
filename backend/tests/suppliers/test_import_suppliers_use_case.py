from io import BytesIO
from unittest.mock import AsyncMock

import pytest
from openpyxl import Workbook

from modules.suppliers.application.import_suppliers_use_case import (
    EXPECTED_HEADERS,
    ImportSuppliersUseCase,
)


def _make_xlsx(headers: list, rows: list[list]) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


def _make_repo(existing_tax_ids: set[str] | None = None) -> AsyncMock:
    repo = AsyncMock()
    repo.get_existing_tax_ids.return_value = existing_tax_ids or set()
    repo.bulk_create.side_effect = lambda suppliers: len(suppliers)
    return repo


VALID_ROW = [
    "Proveedor Test S.L.",
    "B12345674",
    "Calle Mayor 1",
    "Madrid",
    "Madrid",
    "28001",
    "910000000",
    "test@test.com",
]


@pytest.mark.asyncio
async def test_import_success():
    content = _make_xlsx(EXPECTED_HEADERS, [VALID_ROW])
    repo = _make_repo()
    result = await ImportSuppliersUseCase(repo).execute(content)
    assert result.created == 1
    assert result.errors == []


@pytest.mark.asyncio
async def test_import_invalid_file():
    result = await ImportSuppliersUseCase(_make_repo()).execute(b"not an xlsx")
    assert result.created == 0
    assert len(result.errors) == 1
    assert "Invalid or corrupted" in result.errors[0].reason


@pytest.mark.asyncio
async def test_import_wrong_headers():
    content = _make_xlsx(["WrongHeader"] + EXPECTED_HEADERS[1:], [VALID_ROW])
    result = await ImportSuppliersUseCase(_make_repo()).execute(content)
    assert result.created == 0
    assert "Invalid headers" in result.errors[0].reason


@pytest.mark.asyncio
async def test_import_missing_required_field():
    row = VALID_ROW.copy()
    row[0] = ""
    content = _make_xlsx(EXPECTED_HEADERS, [row])
    result = await ImportSuppliersUseCase(_make_repo()).execute(content)
    assert result.created == 0
    assert any("required" in e.reason for e in result.errors)


@pytest.mark.asyncio
async def test_import_invalid_cif():
    row = VALID_ROW.copy()
    row[1] = "INVALID"
    content = _make_xlsx(EXPECTED_HEADERS, [row])
    result = await ImportSuppliersUseCase(_make_repo()).execute(content)
    assert result.created == 0
    assert any("CIF" in e.reason for e in result.errors)


@pytest.mark.asyncio
async def test_import_duplicate_cif_in_file():
    content = _make_xlsx(EXPECTED_HEADERS, [VALID_ROW, VALID_ROW])
    result = await ImportSuppliersUseCase(_make_repo()).execute(content)
    assert result.created == 0
    assert any("Duplicate CIF" in e.reason for e in result.errors)


@pytest.mark.asyncio
async def test_import_duplicate_cif_in_db():
    content = _make_xlsx(EXPECTED_HEADERS, [VALID_ROW])
    repo = _make_repo(existing_tax_ids={"B12345674"})
    result = await ImportSuppliersUseCase(repo).execute(content)
    assert result.created == 0
    assert any("already exists" in e.reason for e in result.errors)


@pytest.mark.asyncio
async def test_import_tax_id_normalized_to_upper():
    row = VALID_ROW.copy()
    row[1] = "b12345674"
    content = _make_xlsx(EXPECTED_HEADERS, [row])
    repo = _make_repo()
    result = await ImportSuppliersUseCase(repo).execute(content)
    assert result.created == 1
    call_args = repo.bulk_create.call_args[0][0]
    assert call_args[0].tax_id == "B12345674"
