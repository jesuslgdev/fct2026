from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from modules.auth.infrastructure.repos.auth_repository import AuthRepository
from shared.domain.dtos.user_session import UserSession
from shared.infrastructure.database.connection import get_db
from shared.infrastructure.security.firebase_auth_provider import verify_firebase_token

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> UserSession:
    try:
        claims = verify_firebase_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = await AuthRepository(db).find_user_by_email(claims["email"])

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return UserSession(
        user_id=user.user_id,
        email=user.email,
        role=user.role,
        department_id=user.department_id,
        firebase_uid=claims["uid"],
        name=f"{user.first_name} {user.last_name}",
        last_login_at=user.last_login_at,
    )


async def require_admin(
    current_user: UserSession = Depends(get_current_user),
) -> UserSession:
    if current_user.role != "Administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator role required",
        )
    return current_user


def require_department_manager_or_admin(department_name: str):
    async def _dependency(
        current_user: UserSession = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> UserSession:
        if current_user.role == "Administrator":
            return current_user
        if current_user.role == "Manager":
            result = await db.execute(
                text("SELECT department_id FROM departments WHERE name = :name"),
                {"name": department_name},
            )
            dept_id = result.scalar_one_or_none()
            if dept_id is not None and current_user.department_id == dept_id:
                return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    return _dependency


require_purchases_manager_or_admin = require_department_manager_or_admin("Purchases")
require_sales_manager_or_admin = require_department_manager_or_admin("Sales")


def require_department_or_admin(department_name: str):
    async def _dependency(
        current_user: UserSession = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> UserSession:
        if current_user.role == "Administrator":
            return current_user
        result = await db.execute(
            text("SELECT department_id FROM departments WHERE name = :name"),
            {"name": department_name},
        )
        dept_id = result.scalar_one_or_none()
        if dept_id is not None and current_user.department_id == dept_id:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    return _dependency


require_purchases_department_or_admin = require_department_or_admin("Purchases")
