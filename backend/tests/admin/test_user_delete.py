from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department
from shared.domain.dtos.address import Address
from shared.domain.entities.user import User


async def test_delete_user_hard_delete_when_no_references(
    admin_client: AsyncClient, db_session: AsyncSession
):
    user = User(
        first_name="ToDelete",
        last_name="User",
        email="todelete@example.com",
        role="Administrator",
        is_active=False,
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.delete(f"/api/v1/admin/users/{user.user_id}")
    assert response.status_code == 204

    get_response = await admin_client.get(f"/api/v1/admin/users/{user.user_id}")
    assert get_response.status_code == 404


async def test_delete_user_anonymizes_when_has_purchases(
    admin_client: AsyncClient, db_session: AsyncSession
):
    from modules.purchases.domain.entities.purchase import Purchase
    from modules.suppliers.domain.entities.supplier import Supplier
    from modules.warehouse.domain.entities.warehouse import Warehouse

    dept = Department(name="Purchasing")
    db_session.add(dept)
    user = User(
        first_name="Buyer",
        last_name="User",
        email="buyer@example.com",
        role="Employee",
        department_id=None,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()
    user.department_id = dept.department_id
    await db_session.flush()

    supplier = Supplier(
        name="Test Supplier",
        tax_id="TAX12345",
        street="123 Main St",
        city="Barcelona",
        province="Catalonia",
        postal_code="08001",
        phone="123456789",
        email="supplier@example.com",
    )
    db_session.add(supplier)
    warehouse = Warehouse(
        name="Main",
        address_data=Address(
            street="HQ",
            city="Madrid",
            province="Madrid",
            postal_code="28001",
        ),
    )
    db_session.add(warehouse)
    await db_session.flush()

    purchase = Purchase(
        purchase_number="PO-TEST-001",
        supplier_id=supplier.supplier_id,
        user_id=user.user_id,
        warehouse_id=warehouse.warehouse_id,
    )
    db_session.add(purchase)
    await db_session.flush()

    response = await admin_client.delete(f"/api/v1/admin/users/{user.user_id}")
    assert response.status_code == 204

    await db_session.refresh(user)
    assert user.is_deleted is True
    assert user.is_active is False
    assert user.first_name == "DELETED"
    assert user.last_name == "DELETED"
    assert user.email == f"deleted_{user.user_id}@deleted.com"


async def test_delete_user_already_deleted(
    admin_client: AsyncClient, db_session: AsyncSession
):
    user = User(
        first_name="DELETED",
        last_name="DELETED",
        email="deleted_0@deleted.com",
        role="Employee",
        is_active=False,
        is_deleted=True,
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.delete(f"/api/v1/admin/users/{user.user_id}")
    assert response.status_code == 409
    assert response.json()["error_code"] == 1208


async def test_deleted_user_hidden_from_list(
    admin_client: AsyncClient, db_session: AsyncSession
):
    user = User(
        first_name="DELETED",
        last_name="DELETED",
        email="deleted_hidden@deleted.com",
        role="Employee",
        is_active=False,
        is_deleted=True,
    )
    db_session.add(user)
    await db_session.flush()

    response = await admin_client.get("/api/v1/admin/users")
    assert response.status_code == 200
    user_ids = [u["user_id"] for u in response.json()["items"]]
    assert user.user_id not in user_ids


async def test_delete_user_not_found(admin_client: AsyncClient):
    response = await admin_client.delete("/api/v1/admin/users/99999")
    assert response.status_code == 404


async def test_delete_user_unauthorized(unauthenticated_client: AsyncClient):
    response = await unauthenticated_client.delete("/api/v1/admin/users/1")
    assert response.status_code == 401


async def test_delete_user_forbidden(non_admin_client: AsyncClient):
    response = await non_admin_client.delete("/api/v1/admin/users/1")
    assert response.status_code == 403
