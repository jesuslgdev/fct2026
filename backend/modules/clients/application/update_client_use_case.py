"""Use case: update the data of an existing client."""

from modules.clients.domain.entities.client import Client
from modules.clients.domain.exceptions import ClientException, ClientExceptionInfo
from modules.clients.domain.interfaces.repositories.i_client_repository import (
    IClientRepository,
)
from modules.clients.domain.interfaces.use_cases.i_update_client_use_case import (
    IUpdateClientUseCase,
)
from shared.domain.dtos.address import Address


class UpdateClientUseCase(IUpdateClientUseCase):
    """Updates the editable fields of an already registered client.

    The ``tax_id`` is not updatable because it is the client's legal
    identifier; any change to it would require deactivating the current
    client and creating a new one.

    Only fields provided with a value other than ``None`` are written to the
    database; the rest retain their current values.
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
        client_id: int,
        name: str | None,
        address_data: Address | None,
        phone: str | None,
        email: str | None,
    ) -> Client:
        """Update the provided fields of the given client.

        Args:
            client_id: Primary key of the client to update.
            name: New name or company name, or ``None`` to leave it unchanged.
            address_data: New full address object, or ``None`` to keep the
                current address unchanged.
            phone: New phone number, or ``None`` to leave it unchanged.
            email: New email address, or ``None`` to leave it unchanged.

        Returns:
            The ``Client`` entity with the updated data.

        Raises:
            ClientException: With code ``4101`` (``CLIENT_NOT_FOUND``) if no
                client exists with that ``client_id``.
        """
        client = await self._repo.get_by_id(client_id)
        if client is None:
            raise ClientException(ClientExceptionInfo.CLIENT_NOT_FOUND)

        return await self._repo.update(
            client_id=client_id,
            name=name,
            address_data=address_data,
            phone=phone,
            email=email,
        )
