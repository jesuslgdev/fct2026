from abc import ABC, abstractmethod


class ILogoutUseCase(ABC):
    @abstractmethod
    def logout(self, firebase_uid: str) -> None: ...
