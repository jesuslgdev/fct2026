from abc import ABC, abstractmethod


class IPurchaseReader(ABC):
    """Read-only interface for cross-module access to purchase data."""

    @abstractmethod
    async def has_purchases_for_user(self, user_id: int) -> bool:
        """Return True if any purchase references the given user."""
        ...
