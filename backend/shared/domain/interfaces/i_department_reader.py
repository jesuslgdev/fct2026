from __future__ import annotations

from abc import ABC, abstractmethod


class IDepartmentReader(ABC):
    """Read-only interface for cross-module access to department data.

    Implement this interface in ``DepartmentRepository`` so that other modules
    can resolve department names without importing admin internals directly.
    """

    @abstractmethod
    async def get_name_by_id(self, department_id: int) -> str | None:
        """Return the name of the department with the given identifier.

        Args:
            department_id: Primary key of the department to retrieve.

        Returns:
            The department name, or ``None`` if the department does not exist.
        """
        ...
