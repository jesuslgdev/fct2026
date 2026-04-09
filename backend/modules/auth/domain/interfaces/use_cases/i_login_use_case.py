from abc import ABC, abstractmethod

from modules.auth.domain.dtos.login_result import LoginResult


class ILoginUseCase(ABC):
    @abstractmethod
    async def login(self, firebase_id_token: str) -> LoginResult: ...
