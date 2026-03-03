from modules.auth.domain.interfaces.i_logout_use_case import ILogoutUseCase
from shared.infrastructure.security.firebase_auth_provider import revoke_firebase_tokens


class LogoutUseCase(ILogoutUseCase):
    async def logout(self, firebase_uid: str) -> None:
        revoke_firebase_tokens(firebase_uid)
