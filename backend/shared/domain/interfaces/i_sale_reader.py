from abc import ABC, abstractmethod


class ISaleReader(ABC):
    """Read-only interface for cross-module access to sale data."""

    @abstractmethod
    async def has_sales_for_user(self, user_id: int) -> bool:
        """Return True if any sale references the given user."""
        ...
