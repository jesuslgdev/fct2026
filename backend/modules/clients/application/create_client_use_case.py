"""Use case: create a new client."""

import re

from modules.clients.domain.entities.client import Client
from modules.clients.domain.exceptions import ClientException, ClientExceptionInfo
from modules.clients.domain.interfaces.repositories.i_client_repository import (
    IClientRepository,
)
from modules.clients.domain.interfaces.use_cases.i_create_client_use_case import (
    ICreateClientUseCase,
)
from shared.constants import TAX_ID_PATTERN


class CreateClientUseCase(ICreateClientUseCase):
    """Validates and persists a new client in the system.

    The process follows three ordered steps:

    1. Validate the NIF/NIE/CIF format against ``TAX_ID_PATTERN``.
    2. Verify that no existing client shares the same ``tax_id``.
    3. Persist the client with the ``tax_id`` normalised to uppercase.
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
        name: str,
        tax_id: str,
        address: str,
        city: str,
        province: str,
        postal_code: str,
        phone: str,
        email: str,
    ) -> Client:
        """Create a client after validating the NIF/NIE/CIF and checking uniqueness.

        The ``tax_id`` is normalised to uppercase before validation and
        storage to ensure consistency regardless of how it is submitted by
        the HTTP client.

        Args:
            name: Client name or company name (max 200 characters).
            tax_id: Spanish tax identifier (NIF, NIE or CIF).
            address: Full postal address.
            city: City.
            province: Province.
            postal_code: Postal code (typically 5 digits).
            phone: Contact phone number.
            email: Contact email address.

        Returns:
            The newly created and persisted ``Client`` entity.

        Raises:
            ClientException: With code ``4103`` (``CLIENT_INVALID_TAX_ID``) if
                the ``tax_id`` does not match the NIF/NIE/CIF format.
            ClientException: With code ``4102`` (``CLIENT_ALREADY_EXISTS``) if
                a client with that ``tax_id`` is already registered.
        """
        normalized_tax_id = tax_id.upper()

        if not re.match(TAX_ID_PATTERN, normalized_tax_id):
            raise ClientException(ClientExceptionInfo.CLIENT_INVALID_TAX_ID)

        existing = await self._repo.get_by_tax_id(normalized_tax_id)
        if existing is not None:
            raise ClientException(ClientExceptionInfo.CLIENT_ALREADY_EXISTS)

        return await self._repo.create(
            name=name,
            tax_id=normalized_tax_id,
            address=address,
            city=city,
            province=province,
            postal_code=postal_code,
            phone=phone,
            email=email,
        )
