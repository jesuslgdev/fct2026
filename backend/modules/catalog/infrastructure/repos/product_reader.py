from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.catalog.domain.entities.product import Product
from shared.domain.interfaces.i_product_reader import IProductReader


class ProductReader(IProductReader):
    """Read-only access to the products table.

    Implements the shared IProductReader contract so that other modules
    can look up product data without importing the catalog module directly.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, product_id: int) -> Product | None:
        """Fetch a product by its primary key."""
        result = await self._db.execute(
            select(Product).where(Product.product_id == product_id)
        )
        return result.scalar_one_or_none()
