from dataclasses import dataclass

from shared.domain.dtos.user_session import UserSession


@dataclass(frozen=True)
class LoginResult:
    session: UserSession
    permissions: list[str]
