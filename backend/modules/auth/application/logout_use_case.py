from fastapi import HTTPException, status

from modules.auth.domain.interfaces.i_logout_use_case import ILogoutUseCase
from shared.infrastructure.security.firebase_auth_provider import revoke_firebase_tokens


class LogoutUseCase(ILogoutUseCase):
    def logout(self, firebase_uid: str) -> None:
        try:
            revoke_firebase_tokens(firebase_uid)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not revoke session, please try again",
            )
