from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.clients.domain.entities.client import Client
from modules.clients.domain.exceptions import ClientException, ClientExceptionInfo
from modules.clients.domain.interfaces.repositories.i_client_repository import (
    IClientRepository,
)
from shared.domain.interfaces.i_client_reader import IClientReader
from shared.domain.paginated_result import PaginatedResult


class ClientRepository(IClientRepository, IClientReader):
    """Concrete implementation of IClientRepository and IClientReader.

    Handles all database operations for the Client entity using an async
    SQLAlchemy session. Transaction scope (commit/rollback) is managed by
    the caller — this class only calls flush() after writes.

    Implements IClientReader so that cross-module consumers (e.g. the future
    sales module) can depend on the shared interface without coupling to this
    module directly.
    """

    def __init__(self, db: AsyncSession) -> None:
        """Initialize the repository with an async database session.

        Args:
            db: The async SQLAlchemy session for database operations.
        """
        self._db = db

    async def get_all_paginated(
        self,
        page: int,
        page_size: int,
        search: str | None = None,
        active: bool | None = None,
    ) -> PaginatedResult[Client]:
        """Return a paginated list of clients with optional filters.

        Args:
            page: 1-based page number.
            page_size: Number of records per page.
            search: Optional text to filter by name, tax_id or email.
            active: Optional flag to filter by active/inactive status.

        Returns:
            A PaginatedResult containing the requested page of clients.
        """
        base_query = select(Client)
        count_query = select(func.count()).select_from(Client)

        if search:
            pattern = f"%{search}%"
            search_filter = (
                Client.name.ilike(pattern)
                | Client.tax_id.ilike(pattern)
                | Client.email.ilike(pattern)
            )
            base_query = base_query.where(search_filter)
            count_query = count_query.where(search_filter)

        if active is not None:
            base_query = base_query.where(Client.is_active == active)
            count_query = count_query.where(Client.is_active == active)

        total_result = await self._db.execute(count_query)
        total = total_result.scalar_one()

        offset = (page - 1) * page_size
        result = await self._db.execute(
            base_query.order_by(Client.client_id).limit(page_size).offset(offset)
        )
        items = list(result.scalars().all())

        return PaginatedResult(items=items, total=total, page=page, page_size=page_size)

    async def get_by_id(self, client_id: int) -> Client | None:
        """Fetch a single client by its primary key.

        Args:
            client_id: The primary key of the client to retrieve.

        Returns:
            The Client instance if found, or None.
        """
        result = await self._db.execute(
            select(Client).where(Client.client_id == client_id)
        )
        return result.scalar_one_or_none()

    async def get_by_tax_id(self, tax_id: str) -> Client | None:
        """Fetch a single client by their Spanish tax ID (NIF/NIE/CIF).

        Args:
            tax_id: The tax ID to look up. Must be uppercase.

        Returns:
            The Client instance if found, or None.
        """
        result = await self._db.execute(select(Client).where(Client.tax_id == tax_id))
        return result.scalar_one_or_none()

    async def create(
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
        """Persist a new client record.

        Args:
            name: Full legal name of the client.
            tax_id: Spanish tax ID (NIF/NIE/CIF). Must be uppercase and
                validated by the caller before calling this method.
            address: Street address.
            city: City.
            province: Province.
            postal_code: Postal code.
            phone: Contact phone number.
            email: Contact email address.

        Returns:
            The newly created Client instance with auto-generated fields populated.
        """
        client = Client(
            name=name,
            tax_id=tax_id,
            address=address,
            city=city,
            province=province,
            postal_code=postal_code,
            phone=phone,
            email=email,
        )
        self._db.add(client)
        await self._db.flush()
        await self._db.refresh(client)
        return client

    async def update(
        self,
        client_id: int,
        name: str | None,
        address: str | None,
        city: str | None,
        province: str | None,
        postal_code: str | None,
        phone: str | None,
        email: str | None,
    ) -> Client:
        """Update mutable fields of an existing client.

        Only fields provided as non-None are applied. The tax_id field is
        intentionally excluded — it is immutable after creation.

        Args:
            client_id: Primary key of the client to update.
            name: New name, or None to leave unchanged.
            address: New address, or None to leave unchanged.
            city: New city, or None to leave unchanged.
            province: New province, or None to leave unchanged.
            postal_code: New postal code, or None to leave unchanged.
            phone: New phone number, or None to leave unchanged.
            email: New email address, or None to leave unchanged.

        Returns:
            The updated Client instance with refreshed values.

        Raises:
            ClientException: When no client exists with the given client_id.
        """
        client = await self.get_by_id(client_id)
        if client is None:
            raise ClientException(ClientExceptionInfo.CLIENT_NOT_FOUND)
        if name is not None:
            client.name = name
        if address is not None:
            client.address = address
        if city is not None:
            client.city = city
        if province is not None:
            client.province = province
        if postal_code is not None:
            client.postal_code = postal_code
        if phone is not None:
            client.phone = phone
        if email is not None:
            client.email = email
        await self._db.flush()
        await self._db.refresh(client)
        return client

    async def set_active(self, client_id: int, is_active: bool) -> None:
        """Set the active/inactive status of a client (soft delete).

        Args:
            client_id: Primary key of the client to update.
            is_active: True to activate, False to deactivate.

        Raises:
            ClientException: When no client exists with the given client_id.
        """
        client = await self.get_by_id(client_id)
        if client is None:
            raise ClientException(ClientExceptionInfo.CLIENT_NOT_FOUND)
        client.is_active = is_active
        await self._db.flush()

    async def get_name_by_id(self, client_id: int) -> str:
        """Return the display name of a client by ID.

        Intended for cross-module use (e.g. the sales module) via the
        IClientReader shared interface, without exposing the full entity.

        Args:
            client_id: Primary key of the client.

        Returns:
            The client's name string.

        Raises:
            ClientException: When no client exists with the given client_id.
        """
        client = await self.get_by_id(client_id)
        if client is None:
            raise ClientException(ClientExceptionInfo.CLIENT_NOT_FOUND)
        return client.name
