from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.product import Product
from shared.domain.interfaces.i_product_stock_updater import IProductStockUpdater


class ProductStockUpdater(IProductStockUpdater):
    """Write access to update product stock_current.

    Implements the shared IProductStockUpdater contract so that other modules
    can update product stock without importing the catalog module directly.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def update_stock_current(self, product_id: int, new_stock: int) -> None:
        """Set the global stock_current value for a product."""
        await self._db.execute(
            update(Product)
            .where(Product.product_id == product_id)
            .values(stock_current=new_stock)
        )
        await self._db.flush()
