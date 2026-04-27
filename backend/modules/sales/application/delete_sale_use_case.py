from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from modules.sales.domain.interfaces.repositories.i_sale_repository import (
    ISaleRepository,
)
from modules.sales.domain.interfaces.use_cases.i_delete_sale_use_case import (
    IDeleteSaleUseCase,
)


class DeleteSaleUseCase(IDeleteSaleUseCase):
    def __init__(self, sale_repo: ISaleRepository) -> None:
        self._sale_repo = sale_repo

    async def execute(self, sale_id: int) -> None:
        sale = await self._sale_repo.get_by_id(sale_id)
        if sale is None:
            raise SaleException(SaleExceptionInfo.SALE_NOT_FOUND)
        if sale.status != "Pending":
            raise SaleException(SaleExceptionInfo.SALE_NOT_DELETABLE)
        await self._sale_repo.delete_sale(sale_id)
