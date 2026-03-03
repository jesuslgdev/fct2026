from abc import ABC, abstractmethod


class ILogoutUseCase(ABC):
    @abstractmethod
    async def logout(self, firebase_uid: str) -> None: ...
