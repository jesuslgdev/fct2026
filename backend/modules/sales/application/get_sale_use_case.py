from modules.sales.domain.entities.sale import Sale
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from modules.sales.domain.interfaces.repositories.i_sale_repository import (
    ISaleRepository,
)
from modules.sales.domain.interfaces.use_cases.i_get_sale_use_case import (
    IGetSaleUseCase,
)
from shared.domain.interfaces.i_client_reader import IClientReader
from shared.domain.interfaces.i_user_reader import IUserReader


class GetSaleUseCase(IGetSaleUseCase):
    def __init__(
        self,
        repo: ISaleRepository,
        user_reader: IUserReader,
        client_reader: IClientReader,
    ) -> None:
        self._repo = repo
        self._user_reader = user_reader
        self._client_reader = client_reader

    async def execute(self, sale_id: int) -> Sale:
        sale = await self._repo.get_by_id(sale_id)
        if sale is None:
            raise SaleException(SaleExceptionInfo.SALE_NOT_FOUND)
        creator_name = await self._user_reader.get_name_by_id(sale.user_id)
        client_name = await self._client_reader.get_name_by_id(sale.client_id)
        setattr(sale, "creator_name", creator_name)
        setattr(sale, "client_name", client_name)
        unique_user_ids = {h.changed_by_user_id for h in sale.status_history or []}
        user_names: dict[int, str | None] = {
            uid: await self._user_reader.get_name_by_id(uid) for uid in unique_user_ids
        }
        for h in sale.status_history or []:
            setattr(h, "changed_by_user_name", user_names.get(h.changed_by_user_id))
        return sale
