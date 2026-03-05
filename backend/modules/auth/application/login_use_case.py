from fastapi import HTTPException, status

from shared.domain.entities.user_session import UserSession
from modules.auth.domain.interfaces.i_auth_repository import IAuthRepository
from modules.auth.domain.interfaces.i_login_use_case import ILoginUseCase
from shared.infrastructure.security.firebase_auth_provider import verify_firebase_token


class LoginUseCase(ILoginUseCase):
    def __init__(self, auth_repository: IAuthRepository) -> None:
        self._repo = auth_repository

    async def login(self, firebase_id_token: str) -> UserSession:
        try:
            claims = verify_firebase_token(firebase_id_token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        email: str = claims["email"]
        user = await self._repo.find_active_user_by_email(email)

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
