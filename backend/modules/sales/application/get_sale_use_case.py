from modules.sales.domain.entities.sale import Sale
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from modules.sales.domain.interfaces.repositories.i_sale_repository import (
    ISaleRepository,
)
from modules.sales.domain.interfaces.use_cases.i_get_sale_use_case import (
    IGetSaleUseCase,
)


class GetSaleUseCase(IGetSaleUseCase):
    def __init__(self, repo: ISaleRepository) -> None:
        self._repo = repo

    async def execute(self, sale_id: int) -> Sale:
        sale = await self._repo.get_by_id(sale_id)
        if sale is None:
            raise SaleException(SaleExceptionInfo.SALE_NOT_FOUND)
        return sale
