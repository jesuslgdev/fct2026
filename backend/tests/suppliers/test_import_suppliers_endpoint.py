from io import BytesIO
from unittest.mock import AsyncMock

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from openpyxl import Workbook

from composition.dependencies import get_import_suppliers_use_case
from composition.security import get_current_user, require_purchases_manager_or_admin
from main import app
from modules.suppliers.domain.dtos.import_result import ImportResult, ImportRowError
from shared.domain.dtos.user_session import UserSession


def _make_xlsx(headers: list, rows: list[list]) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buf = BytesIO()
    wb.save(buf)
    return buf.getvalue()


VALID_HEADERS = [
    "Nombre",
    "CIF",
    "Dirección",
    "Ciudad",
    "Provincia",
    "Código Postal",
    "Teléfono",
    "Email",
]
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


def _mock_user(role: str):
    def override():
        return UserSession(
            user_id=1,
            email="test@test.com",
            role=role,
            department_id=None,
            firebase_uid="test-uid",
            name="Test User",
        )

    return override


def _mock_use_case(result: ImportResult):
    mock = AsyncMock()
    mock.execute.return_value = result

    def override():
        return mock

    return override


@pytest_asyncio.fixture
async def admin_client():
    app.dependency_overrides[get_current_user] = _mock_user("Administrator")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]


@pytest_asyncio.fixture
async def manager_client():
    app.dependency_overrides[get_current_user] = _mock_user("Manager")
    app.dependency_overrides[require_purchases_manager_or_admin] = _mock_user("Manager")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]
    del app.dependency_overrides[require_purchases_manager_or_admin]


@pytest_asyncio.fixture
async def employee_client():
    app.dependency_overrides[get_current_user] = _mock_user("Employee")
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    del app.dependency_overrides[get_current_user]


async def test_administrator_can_import(admin_client: AsyncClient):
    app.dependency_overrides[get_import_suppliers_use_case] = _mock_use_case(
        ImportResult(total=1, created=1, errors=[])
    )
    content = _make_xlsx(VALID_HEADERS, [VALID_ROW])
    response = await admin_client.post(
        "/api/v1/suppliers/import",
        files={
            "file": (
                "suppliers.xlsx",
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["created"] == 1
    assert body["errors"] == 0
    del app.dependency_overrides[get_import_suppliers_use_case]


async def test_manager_can_import(manager_client: AsyncClient):
    app.dependency_overrides[get_import_suppliers_use_case] = _mock_use_case(
        ImportResult(total=1, created=1, errors=[])
    )
    content = _make_xlsx(VALID_HEADERS, [VALID_ROW])
    response = await manager_client.post(
        "/api/v1/suppliers/import",
        files={
            "file": (
                "suppliers.xlsx",
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )
    assert response.status_code == 200
    del app.dependency_overrides[get_import_suppliers_use_case]


async def test_import_with_errors_returns_200_with_error_detail(
    admin_client: AsyncClient,
):
    app.dependency_overrides[get_import_suppliers_use_case] = _mock_use_case(
        ImportResult(
            total=1,
            created=0,
            errors=[ImportRowError(row=2, reason="Invalid CIF format")],
        )
    )
    content = _make_xlsx(VALID_HEADERS, [VALID_ROW])
    response = await admin_client.post(
        "/api/v1/suppliers/import",
        files={
            "file": (
                "suppliers.xlsx",
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["created"] == 0
    assert body["errors"] == 1
    assert body["error_detail"][0]["row"] == 2
    del app.dependency_overrides[get_import_suppliers_use_case]


async def test_employee_gets_forbidden(employee_client: AsyncClient):
    content = _make_xlsx(VALID_HEADERS, [VALID_ROW])
    response = await employee_client.post(
        "/api/v1/suppliers/import",
        files={
            "file": (
                "suppliers.xlsx",
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )
    assert response.status_code == 403


async def test_unauthenticated_gets_unauthorized(unauthenticated_client: AsyncClient):
    content = _make_xlsx(VALID_HEADERS, [VALID_ROW])
    response = await unauthenticated_client.post(
        "/api/v1/suppliers/import",
        files={
            "file": (
                "suppliers.xlsx",
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )
    assert response.status_code == 401
