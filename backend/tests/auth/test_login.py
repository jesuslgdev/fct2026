from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from modules.admin.domain.entities.department import Department
from shared.domain.entities.user import User

FAKE_TOKEN = "fake-firebase-token"


def _fake_claims(email: str, uid: str = "test-uid") -> dict:
    return {"email": email, "uid": uid}


async def test_login_first_login_activates_user(
    auth_client: AsyncClient,
    db_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
):
    """Inactive user with no last_login_at is activated on first login."""
    dept = Department(name="Onboarding")
    db_session.add(dept)
    user = User(
        first_name="New",
        last_name="Employee",
        email="newemployee@example.com",
        role="Employee",
        is_active=False,
        last_login_at=None,
    )
    db_session.add(user)
    await db_session.flush()
    user.department_id = dept.department_id
    await db_session.flush()

    monkeypatch.setattr(
        "modules.auth.application.login_use_case.verify_firebase_token",
        lambda token: _fake_claims(user.email),
    )

    response = await auth_client.post(
        "/api/v1/auth/login", json={"firebase_id_token": FAKE_TOKEN}
    )
    assert response.status_code == 200

    await db_session.refresh(user)
    assert user.is_active is True
    assert user.last_login_at is not None


async def test_login_active_user_updates_last_login(
    auth_client: AsyncClient,
    db_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
):
    """Active user login updates last_login_at."""
    old_login = datetime(2025, 1, 1, tzinfo=UTC)
    user = User(
        first_name="Active",
        last_name="User",
        email="activeuser@example.com",
        role="Administrator",
        is_active=True,
        last_login_at=old_login,
    )
    db_session.add(user)
    await db_session.flush()

    monkeypatch.setattr(
        "modules.auth.application.login_use_case.verify_firebase_token",
        lambda token: _fake_claims(user.email),
    )

    response = await auth_client.post(
        "/api/v1/auth/login", json={"firebase_id_token": FAKE_TOKEN}
    )
    assert response.status_code == 200

    await db_session.refresh(user)
    assert user.last_login_at is not None
    assert user.last_login_at > old_login


async def test_login_deactivated_user_rejected(
    auth_client: AsyncClient,
    db_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
):
    """Inactive user who has previously logged in (deactivated) is rejected."""
    user = User(
        first_name="DELETED",
        last_name="DELETED",
        email="deleted_99@deleted.com",
        role="Employee",
        is_active=False,
        last_login_at=datetime(2025, 6, 1, tzinfo=UTC),
    )
    db_session.add(user)
    await db_session.flush()

    monkeypatch.setattr(
        "modules.auth.application.login_use_case.verify_firebase_token",
        lambda token: _fake_claims(user.email),
    )

    response = await auth_client.post(
        "/api/v1/auth/login", json={"firebase_id_token": FAKE_TOKEN}
    )
    assert response.status_code == 401


async def test_login_unknown_email_rejected(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    """Firebase token with an email not in the DB is rejected."""
    monkeypatch.setattr(
        "modules.auth.application.login_use_case.verify_firebase_token",
        lambda token: _fake_claims("nobody@example.com"),
    )

    response = await auth_client.post(
        "/api/v1/auth/login", json={"firebase_id_token": FAKE_TOKEN}
    )
    assert response.status_code == 401


async def test_login_invalid_token_rejected(
    auth_client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
):
    """Invalid Firebase token raises 401."""
    monkeypatch.setattr(
        "modules.auth.application.login_use_case.verify_firebase_token",
        lambda token: (_ for _ in ()).throw(Exception("invalid token")),
    )

    response = await auth_client.post(
        "/api/v1/auth/login", json={"firebase_id_token": FAKE_TOKEN}
    )
    assert response.status_code == 401
