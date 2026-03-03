from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from modules.auth.infrastructure.http.schemas.login_response import LoginResponseDTO


class ILoginUseCase(ABC):
    @abstractmethod
    async def login(self, firebase_id_token: str) -> "LoginResponseDTO": ...
