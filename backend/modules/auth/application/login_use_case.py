from fastapi import HTTPException, status

from modules.auth.domain.interfaces.i_auth_repository import IAuthRepository
from modules.auth.domain.interfaces.i_auth_use_cases import IAuthUseCases
from modules.auth.infrastructure.http.schemas.login_response import LoginResponseDTO
from shared.infrastructure.security.firebase_service import verify_firebase_token


class LoginUseCase(IAuthUseCases):
    def __init__(self, auth_repository: IAuthRepository) -> None:
        self._repo = auth_repository

    async def login(self, firebase_id_token: str) -> LoginResponseDTO:
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

        return LoginResponseDTO(
            role=user.role,
            department_id=user.department_id,
            name=f"{user.first_name} {user.last_name}",
        )
