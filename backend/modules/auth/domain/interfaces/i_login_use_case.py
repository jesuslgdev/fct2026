from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from modules.auth.application.dtos.login_response_dto import LoginResponseDTO


class ILoginUseCase(ABC):
    @abstractmethod
    async def login(self, firebase_id_token: str) -> "LoginResponseDTO": ...
