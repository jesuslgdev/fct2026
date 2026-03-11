from abc import ABC, abstractmethod

from shared.domain.entities.user_session import UserSession


class ILoginUseCase(ABC):
    @abstractmethod
    async def login(self, firebase_id_token: str) -> UserSession: ...
