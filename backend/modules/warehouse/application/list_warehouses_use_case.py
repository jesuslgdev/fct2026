from modules.warehouse.domain.interfaces.repositories.i_warehouse_repository import (
    IWarehouseRepository,
)
from modules.warehouse.domain.interfaces.use_cases.i_list_warehouses_use_case import (
    IListWarehousesUseCase,
)
from modules.warehouse.domain.warehouse_detail import WarehouseDetail


class ListWarehousesUseCase(IListWarehousesUseCase):
    """Lists all warehouses with their total stock."""

    def __init__(self, repo: IWarehouseRepository) -> None:
        self._repo = repo

    async def execute(self) -> list[WarehouseDetail]:
        warehouses = await self._repo.get_all()
        result = []
        for w in warehouses:
            total_stock = await self._repo.get_total_stock(w.warehouse_id)
            result.append(
                WarehouseDetail(
                    warehouse_id=w.warehouse_id,
                    name=w.name,
                    address=w.address,
                    total_stock=total_stock,
                )
            )
        return result
