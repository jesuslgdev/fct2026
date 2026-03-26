"""Use case: activate or deactivate a client."""

from modules.clients.domain.exceptions import ClientException, ClientExceptionInfo
from modules.clients.domain.interfaces.repositories.i_client_repository import (
    IClientRepository,
)
from modules.clients.domain.interfaces.use_cases.i_set_client_active_use_case import (
    ISetClientActiveUseCase,
)


class SetClientActiveUseCase(ISetClientActiveUseCase):
    """Toggles the activation state of a client (logical enable/disable).

    The deactivation is logical: the record remains in the database with
    ``is_active = False``, preserving the history of operations associated
    with the client (orders, invoices, etc.).
    """

    def __init__(self, repo: IClientRepository) -> None:
        """Initialise the use case with the client repository.

        Args:
            repo: ``IClientRepository`` implementation injected by the
                dependency container.
        """
        self._repo = repo

    async def execute(self, client_id: int, is_active: bool) -> None:
        """Set the ``is_active`` flag of the given client.

        Args:
            client_id: Primary key of the client to modify.
            is_active: ``True`` to activate the client, ``False`` to
                deactivate it (logical soft-delete).

        Raises:
            ClientException: With code ``4101`` (``CLIENT_NOT_FOUND``) if no
                client exists with that ``client_id``.
        """
        client = await self._repo.get_by_id(client_id)
        if client is None:
            raise ClientException(ClientExceptionInfo.CLIENT_NOT_FOUND)

        await self._repo.set_active(client_id, is_active)
