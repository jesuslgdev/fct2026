from modules.warehouse.domain.entities.warehouse import Warehouse
from modules.warehouse.domain.exceptions import (
    WarehouseException,
    WarehouseExceptionInfo,
)
from modules.warehouse.domain.interfaces.repositories.i_warehouse_repository import (
    IWarehouseRepository,
)
from modules.warehouse.domain.interfaces.use_cases.i_create_warehouse_use_case import (
    ICreateWarehouseUseCase,
)
from shared.domain.dtos.address import Address


class CreateWarehouseUseCase(ICreateWarehouseUseCase):
    """Creates a new warehouse after validating name uniqueness."""

    def __init__(self, repo: IWarehouseRepository) -> None:
        self._repo = repo

    async def execute(self, name: str, address_data: Address) -> Warehouse:
        existing = await self._repo.get_by_name(name)
        if existing is not None:
            raise WarehouseException(WarehouseExceptionInfo.WAREHOUSE_NAME_DUPLICATE)
        return await self._repo.create(name, address_data)
