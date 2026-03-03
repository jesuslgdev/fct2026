from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from modules.auth.domain.entities.user_session import UserSession
from modules.auth.infrastructure.repos.auth_repository import AuthRepository
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

    user = await AuthRepository(db).find_active_user_by_email(claims["email"])

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return UserSession(
        email=user.email,
        role=user.role,
        department_id=user.department_id,
        firebase_uid=claims["uid"],
        name=f"{user.first_name} {user.last_name}",
    )
