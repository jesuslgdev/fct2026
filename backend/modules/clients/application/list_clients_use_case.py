"""Use case: list clients with pagination."""

from modules.clients.domain.entities.client import Client
from modules.clients.domain.interfaces.repositories.i_client_repository import (
    IClientRepository,
)
from modules.clients.domain.interfaces.use_cases.i_list_clients_use_case import (
    IListClientsUseCase,
)
from shared.domain.dtos.paginated_result import PaginatedResult


class ListClientsUseCase(IListClientsUseCase):
    """Returns a page of clients ordered by ``client_id``.

    No additional filters are applied; access is already restricted
    at the HTTP layer via ``get_current_user``.
    """

    def __init__(self, repo: IClientRepository) -> None:
        """Initialise the use case with the client repository.

        Args:
            repo: ``IClientRepository`` implementation injected by the
                dependency container.
        """
        self._repo = repo

    async def execute(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        active: bool | None = None,
    ) -> PaginatedResult[Client]:
        """Run the paginated client query.

        Args:
            page: Page number (1-based).
            page_size: Maximum number of records per page.
            search: Optional text to filter by name, tax_id or email.
            active: Optional flag to filter by active/inactive status.

        Returns:
            ``PaginatedResult`` containing the clients for the requested page
            and the total number of available records.
        """
        return await self._repo.get_all_paginated(
            page, page_size, search=search, active=active
        )
