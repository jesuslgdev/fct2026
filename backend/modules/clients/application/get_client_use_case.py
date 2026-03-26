"""Use case: retrieve a single client by its identifier."""

from modules.clients.domain.entities.client import Client
from modules.clients.domain.exceptions import ClientException, ClientExceptionInfo
from modules.clients.domain.interfaces.repositories.i_client_repository import (
    IClientRepository,
)
from modules.clients.domain.interfaces.use_cases.i_get_client_use_case import (
    IGetClientUseCase,
)


class GetClientUseCase(IGetClientUseCase):
    """Fetches the full details of a client by its ``client_id``.

    Raises ``ClientException(CLIENT_NOT_FOUND)`` when the identifier does not
    exist so the HTTP layer can translate it to a ``404`` response.
    """

    def __init__(self, repo: IClientRepository) -> None:
        """Initialise the use case with the client repository.

        Args:
            repo: ``IClientRepository`` implementation injected by the
                dependency container.
        """
        self._repo = repo

    async def execute(self, client_id: int) -> Client:
        """Fetch the client with the given identifier.

        Args:
            client_id: Primary key of the client to retrieve.

        Returns:
            The ``Client`` entity matching the given identifier.

        Raises:
            ClientException: With code ``4101`` (``CLIENT_NOT_FOUND``) if no
                client exists with that ``client_id``.
        """
        client = await self._repo.get_by_id(client_id)
        if client is None:
            raise ClientException(ClientExceptionInfo.CLIENT_NOT_FOUND)
        return client
