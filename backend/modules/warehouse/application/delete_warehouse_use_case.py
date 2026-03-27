from modules.warehouse.domain.exceptions import (
    WarehouseException,
    WarehouseExceptionInfo,
)
from modules.warehouse.domain.interfaces.repositories.i_warehouse_repository import (
    IWarehouseRepository,
)
from modules.warehouse.domain.interfaces.use_cases.i_delete_warehouse_use_case import (
    IDeleteWarehouseUseCase,
)


class DeleteWarehouseUseCase(IDeleteWarehouseUseCase):
    """Deletes a warehouse if it has no stock associated."""

    def __init__(self, repo: IWarehouseRepository) -> None:
        self._repo = repo

    async def execute(self, warehouse_id: int) -> None:
        warehouse = await self._repo.get_by_id(warehouse_id)
        if warehouse is None:
            raise WarehouseException(WarehouseExceptionInfo.WAREHOUSE_NOT_FOUND)

        total_stock = await self._repo.get_total_stock(warehouse_id)
        if total_stock > 0:
            raise WarehouseException(WarehouseExceptionInfo.WAREHOUSE_HAS_STOCK)

        await self._repo.delete(warehouse_id)
