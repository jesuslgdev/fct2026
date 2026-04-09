from modules.sales.domain.entities.sale import Sale
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from modules.sales.domain.interfaces.repositories.i_sale_repository import (
    ISaleRepository,
)
from modules.sales.domain.interfaces.use_cases.i_get_sale_use_case import (
    IGetSaleUseCase,
)
from shared.domain.interfaces.i_user_reader import IUserReader


class GetSaleUseCase(IGetSaleUseCase):
    def __init__(self, repo: ISaleRepository, user_reader: IUserReader) -> None:
        self._repo = repo
        self._user_reader = user_reader

    async def execute(self, sale_id: int) -> Sale:
        sale = await self._repo.get_by_id(sale_id)
        if sale is None:
            raise SaleException(SaleExceptionInfo.SALE_NOT_FOUND)
        created_by_name = await self._user_reader.get_name_by_id(sale.user_id)
        setattr(sale, "created_by_name", created_by_name)
        return sale
