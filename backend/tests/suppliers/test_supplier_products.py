from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from composition.dependencies import (
    get_add_product_to_supplier_use_case,
    get_download_supplier_product_template_use_case,
    get_import_supplier_products_use_case,
    get_list_product_suppliers_use_case,
    get_list_supplier_products_use_case,
    get_remove_product_from_supplier_use_case,
    get_update_supplier_product_price_use_case,
)
from composition.security import get_current_user, require_purchases_manager_or_admin
from main import app
from modules.suppliers.domain.entities.product_supplier_detail import (
    ProductSupplierDetail,
)
from modules.suppliers.domain.entities.supplier_product import SupplierProduct
from modules.suppliers.domain.entities.supplier_product_detail import (
    SupplierProductDetail,
)
from shared.domain.entities.user_session import UserSession
from shared.domain.paginated_result import PaginatedResult


def _mock_user(role: str = "Administrator"):
    def override():
        return UserSession(
            email="test@test.com",
            role=role,
            department_id=None,
            firebase_uid="test-uid",
            name="Test User",
        )

    return override


def _mock_purchases_auth():
    def override():
        return UserSession(
            email="test@test.com",
            role="Administrator",
            department_id=None,
            firebase_uid="test-uid",
            name="Test User",
        )

    return override


@pytest_asyncio.fixture
async def auth_client():
    app.dependency_overrides[get_current_user] = _mock_user()
    app.dependency_overrides[require_purchases_manager_or_admin] = (
        _mock_purchases_auth()
    )
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


def _make_supplier_product(s_id=1, p_id=1, price=10.5):
    sp = MagicMock(spec=SupplierProduct)
    sp.supplier_id = s_id
    sp.product_id = p_id
    sp.supplier_price = Decimal(str(price))
    return sp


def _make_supplier_product_detail(p_id=1):
    return SupplierProductDetail(
        product_id=p_id,
        product_name=f"Product {p_id}",
        product_code=f"CODE-{p_id}",
        category_name="Cat",
        supplier_price=Decimal("10.50"),
    )


def _make_product_supplier_detail(s_id=1):
    return ProductSupplierDetail(
        supplier_id=s_id,
        supplier_name=f"Supplier {s_id}",
        tax_id=f"B{s_id}123456",
        supplier_price=Decimal("10.50"),
    )


async def test_add_product_to_supplier(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=_make_supplier_product(1, 10, 50.0))
    app.dependency_overrides[get_add_product_to_supplier_use_case] = lambda: mock

    response = await auth_client.post(
        "/api/v1/suppliers/1/products",
        json={"product_id": 10, "supplier_price": 50.0},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["product_id"] == 10
    assert body["supplier_price"] == "50.0"
    mock.execute.assert_called_once_with(1, 10, Decimal("50.0"))


async def test_list_supplier_products(auth_client: AsyncClient):
    mock = MagicMock()
    detail = _make_supplier_product_detail(10)
    mock.execute = AsyncMock(
        return_value=PaginatedResult(items=[detail], total=1, page=1, page_size=20)
    )
    app.dependency_overrides[get_list_supplier_products_use_case] = lambda: mock

    response = await auth_client.get("/api/v1/suppliers/1/products")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["product_id"] == 10
    assert body["items"][0]["product_name"] == "Product 10"


async def test_update_supplier_product_price(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=_make_supplier_product(1, 10, 75.0))
    app.dependency_overrides[get_update_supplier_product_price_use_case] = lambda: mock

    response = await auth_client.put(
        "/api/v1/suppliers/1/products/10",
        json={"supplier_price": 75.0},
    )

    assert response.status_code == 200
    assert response.json()["supplier_price"] == "75.0"
    mock.execute.assert_called_once_with(1, 10, Decimal("75.0"))


async def test_remove_product_from_supplier(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=None)
    app.dependency_overrides[get_remove_product_from_supplier_use_case] = lambda: mock

    response = await auth_client.delete("/api/v1/suppliers/1/products/10")

    assert response.status_code == 204
    mock.execute.assert_called_once_with(1, 10)


async def test_list_product_suppliers_from_catalog(auth_client: AsyncClient):
    mock = MagicMock()
    detail = _make_product_supplier_detail(5)
    mock.execute = AsyncMock(
        return_value=PaginatedResult(items=[detail], total=1, page=1, page_size=20)
    )
    app.dependency_overrides[get_list_product_suppliers_use_case] = lambda: mock

    response = await auth_client.get("/api/v1/suppliers/products/10/suppliers")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["supplier_id"] == 5
    assert body["items"][0]["supplier_name"] == "Supplier 5"


async def test_download_products_template(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = MagicMock(return_value=b"fake-excel-content")
    app.dependency_overrides[get_download_supplier_product_template_use_case] = (
        lambda: mock
    )

    response = await auth_client.get("/api/v1/suppliers/1/products/template")

    assert response.status_code == 200
    assert response.content == b"fake-excel-content"
    assert "spreadsheetml.sheet" in response.headers["content-type"]


async def test_import_supplier_products(auth_client: AsyncClient):
    mock = MagicMock()
    mock.execute = AsyncMock(return_value=MagicMock(total=1, created=1, errors=[]))
    app.dependency_overrides[get_import_supplier_products_use_case] = lambda: mock

    files = {
        "file": (
            "test.xlsx",
            b"content",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    }
    response = await auth_client.post(
        "/api/v1/suppliers/1/products/import", files=files
    )

    assert response.status_code == 200
    body = response.json()
    assert body["created"] == 1
    mock.execute.assert_called_once()
