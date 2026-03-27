from fastapi import APIRouter, Depends, Query, Response

from composition.dependencies import (
    get_create_client_use_case,
    get_get_client_use_case,
    get_list_clients_use_case,
    get_set_client_active_use_case,
    get_update_client_use_case,
)
from composition.security import get_current_user, require_sales_manager_or_admin
from modules.clients.domain.entities.client import Client
from modules.clients.domain.interfaces.use_cases.i_create_client_use_case import (
    ICreateClientUseCase,
)
from modules.clients.domain.interfaces.use_cases.i_get_client_use_case import (
    IGetClientUseCase,
)
from modules.clients.domain.interfaces.use_cases.i_list_clients_use_case import (
    IListClientsUseCase,
)
from modules.clients.domain.interfaces.use_cases.i_set_client_active_use_case import (
    ISetClientActiveUseCase,
)
from modules.clients.domain.interfaces.use_cases.i_update_client_use_case import (
    IUpdateClientUseCase,
)
from modules.clients.infrastructure.http.schemas import (
    ClientDetailDTO,
    ClientDTO,
    CreateClientDTO,
    PaginatedResponse,
    SetClientActiveDTO,
    UpdateClientDTO,
)

router = APIRouter(prefix="/clients", tags=["Clients"])


# ── Client Management ───────────────────────────────────────────


def _to_detail_dto(client: Client) -> ClientDetailDTO:
    """Map a Client ORM entity to a ClientDetailDTO.

    Args:
        client: The ORM entity to map.

    Returns:
        A fully populated ClientDetailDTO.
    """
    return ClientDetailDTO.model_validate(client)


@router.get("", response_model=PaginatedResponse[ClientDTO])
async def list_clients(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    search: str | None = Query(
        None, max_length=255, description="Search by name, tax ID, city or email"
    ),
    active: bool | None = Query(
        None,
        description="Filter by active status. true = active only, false = inactive only, omit for all",
    ),
    use_case: IListClientsUseCase = Depends(get_list_clients_use_case),
    _: dict = Depends(get_current_user),
):
    """Return a paginated list of clients with optional filters.

    Accessible by any authenticated user.
    """
    result = await use_case.execute(page, page_size, search=search, active=active)
    return PaginatedResponse(
        items=[ClientDTO.model_validate(c) for c in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


@router.get("/{client_id}", response_model=ClientDetailDTO)
async def get_client(
    client_id: int,
    use_case: IGetClientUseCase = Depends(get_get_client_use_case),
    _: dict = Depends(get_current_user),
):
    """Return the full detail of a single client.

    Accessible by any authenticated user.
    """
    result = await use_case.execute(client_id)
    return _to_detail_dto(result)


@router.post("", response_model=ClientDetailDTO, status_code=201)
async def create_client(
    body: CreateClientDTO,
    use_case: ICreateClientUseCase = Depends(get_create_client_use_case),
    _: dict = Depends(require_sales_manager_or_admin),
):
    """Create a new client.

    Requires the caller to be an Administrator or a Manager of the Ventas
    department.
    """
    result = await use_case.execute(
        name=body.name,
        tax_id=body.tax_id,
        address=body.address,
        city=body.city,
        province=body.province,
        postal_code=body.postal_code,
        phone=body.phone,
        email=body.email,
    )
    return _to_detail_dto(result)


@router.put("/{client_id}", response_model=ClientDetailDTO)
async def update_client(
    client_id: int,
    body: UpdateClientDTO,
    use_case: IUpdateClientUseCase = Depends(get_update_client_use_case),
    _: dict = Depends(require_sales_manager_or_admin),
):
    """Update the mutable fields of an existing client.

    Requires the caller to be an Administrator or a Manager of the Ventas
    department.
    """
    result = await use_case.execute(
        client_id=client_id,
        name=body.name,
        address=body.address,
        city=body.city,
        province=body.province,
        postal_code=body.postal_code,
        phone=body.phone,
        email=body.email,
    )
    return _to_detail_dto(result)


@router.patch("/{client_id}/active", status_code=204)
async def set_client_active(
    client_id: int,
    body: SetClientActiveDTO,
    use_case: ISetClientActiveUseCase = Depends(get_set_client_active_use_case),
    _: dict = Depends(require_sales_manager_or_admin),
):
    """Activate or deactivate a client (logical soft-delete).

    Requires the caller to be an Administrator or a Manager of the Ventas
    department.
    """
    await use_case.execute(client_id, body.is_active)
    return Response(status_code=204)
