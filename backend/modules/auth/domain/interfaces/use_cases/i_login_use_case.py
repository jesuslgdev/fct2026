from abc import ABC, abstractmethod

from shared.domain.dtos.user_session import UserSession


class ILoginUseCase(ABC):
    @abstractmethod
    async def login(self, firebase_id_token: str) -> UserSession: ...
