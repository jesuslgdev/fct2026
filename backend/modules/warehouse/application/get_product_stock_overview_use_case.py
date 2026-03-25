from modules.warehouse.domain.dtos.product_stock_overview import (
    ProductStockOverview,
)
from modules.warehouse.domain.exceptions import (
    WarehouseException,
    WarehouseExceptionInfo,
)
from modules.warehouse.domain.interfaces.repositories.i_warehouse_stock_repository import (
    IWarehouseStockRepository,
)
from modules.warehouse.domain.interfaces.use_cases.i_get_product_stock_overview_use_case import (
    IGetProductStockOverviewUseCase,
)
from shared.domain.interfaces.i_product_reader import IProductReader


class GetProductStockOverviewUseCase(IGetProductStockOverviewUseCase):
    """Builds the stock overview for a product across all warehouses."""

    def __init__(
        self,
        stock_repo: IWarehouseStockRepository,
        product_reader: IProductReader,
    ) -> None:
        self._stock_repo = stock_repo
        self._product_reader = product_reader

    async def execute(self, product_id: int) -> ProductStockOverview:
        """Retrieve stock overview with global total and per-warehouse breakdown.

        Args:
            product_id: The product to query.

        Returns:
            A ProductStockOverview with alert level and warehouse details.

        Raises:
            WarehouseException: If the product does not exist.
        """
        product = await self._product_reader.get_by_id(product_id)
        if product is None:
            raise WarehouseException(WarehouseExceptionInfo.PRODUCT_NOT_FOUND)

        warehouses = await self._stock_repo.get_stock_by_product(product_id)
        stock_global = sum(w.stock for w in warehouses)
        alert_level = self._compute_alert_level(stock_global, product.stock_min)

        return ProductStockOverview(
            product_id=product.product_id,
            product_code=product.product_code,
            product_name=product.name,
            stock_global=stock_global,
            stock_min=product.stock_min,
            alert_level=alert_level,
            warehouses=warehouses,
        )

    @staticmethod
    def _compute_alert_level(stock_global: int, stock_min: int) -> str:
        """Determine the alert level based on stock vs minimum threshold.

        Returns:
            "critical" if stock is zero, "warning" if below minimum, "ok" otherwise.
        """
        if stock_global == 0:
            return "critical"
        if stock_global < stock_min:
            return "warning"
        return "ok"
