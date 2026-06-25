from modules.warehouse.domain.dtos.warehouse_detail import WarehouseDetail
from modules.warehouse.domain.exceptions import (
    WarehouseException,
    WarehouseExceptionInfo,
)
from modules.warehouse.domain.interfaces.repositories.i_warehouse_repository import (
    IWarehouseRepository,
)
from modules.warehouse.domain.interfaces.use_cases.i_get_warehouse_use_case import (
    IGetWarehouseUseCase,
)


class GetWarehouseUseCase(IGetWarehouseUseCase):
    """Retrieves a single warehouse with its total stock."""

    def __init__(self, repo: IWarehouseRepository) -> None:
        self._repo = repo

    async def execute(self, warehouse_id: int) -> WarehouseDetail:
        warehouse = await self._repo.get_by_id(warehouse_id)
        if warehouse is None:
            raise WarehouseException(WarehouseExceptionInfo.WAREHOUSE_NOT_FOUND)
        total_stock = await self._repo.get_total_stock(warehouse_id)
        return WarehouseDetail(
            warehouse_id=warehouse.warehouse_id,
            name=warehouse.name,
            address=warehouse.address_data,
            total_stock=total_stock,
        )
