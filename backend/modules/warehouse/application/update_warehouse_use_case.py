from modules.warehouse.domain.entities.warehouse import Warehouse
from modules.warehouse.domain.exceptions import (
    WarehouseException,
    WarehouseExceptionInfo,
)
from modules.warehouse.domain.interfaces.repositories.i_warehouse_repository import (
    IWarehouseRepository,
)
from modules.warehouse.domain.interfaces.use_cases.i_update_warehouse_use_case import (
    IUpdateWarehouseUseCase,
)


class UpdateWarehouseUseCase(IUpdateWarehouseUseCase):
    """Updates a warehouse after validating existence and name uniqueness."""

    def __init__(self, repo: IWarehouseRepository) -> None:
        self._repo = repo

    async def execute(self, warehouse_id: int, name: str, address: str) -> Warehouse:
        warehouse = await self._repo.get_by_id(warehouse_id)
        if warehouse is None:
            raise WarehouseException(WarehouseExceptionInfo.WAREHOUSE_NOT_FOUND)

        existing = await self._repo.get_by_name(name)
        if existing is not None and existing.warehouse_id != warehouse_id:
            raise WarehouseException(WarehouseExceptionInfo.WAREHOUSE_NAME_DUPLICATE)

        return await self._repo.update(warehouse_id, name, address)
