from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from shared.domain.entities.user import User


class IUserReader(ABC):
    """Read-only interface for cross-module access to user data.

    Implement this interface in ``UserRepository`` so that other modules
    can resolve user display names without importing admin internals directly.
    """

    @abstractmethod
    async def get_by_id(self, user_id: int) -> User | None:
        """Return the user with the given identifier, or ``None``.

        Args:
            user_id: Primary key of the user to retrieve.

        Returns:
            The matching ``User`` entity, or ``None`` if not found.
        """
        ...

    @abstractmethod
    async def get_name_by_id(self, user_id: int) -> str | None:
        """Return the full name of the user with the given identifier.

        The full name is composed as ``"{first_name} {last_name}"``.

        Args:
            user_id: Primary key of the user.

        Returns:
            The user's full name, or ``None`` if the user does not exist.
        """
        ...
