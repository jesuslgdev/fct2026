from modules.sales.domain.entities.sale import Sale
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from modules.sales.domain.interfaces.repositories.i_sale_repository import (
    ISaleRepository,
)
from modules.sales.domain.interfaces.use_cases.i_remove_sale_line_use_case import (
    IRemoveSaleLineUseCase,
)
from shared.domain.interfaces.i_client_reader import IClientReader
from shared.domain.interfaces.i_user_reader import IUserReader


class RemoveSaleLineUseCase(IRemoveSaleLineUseCase):
    def __init__(
        self,
        sale_repo: ISaleRepository,
        client_reader: IClientReader,
        user_reader: IUserReader,
    ) -> None:
        self._sale_repo = sale_repo
        self._client_reader = client_reader
        self._user_reader = user_reader

    async def execute(self, sale_id: int, sale_line_id: int) -> Sale:
        sale = await self._sale_repo.get_by_id(sale_id)
        if sale is None:
            raise SaleException(SaleExceptionInfo.SALE_NOT_FOUND)
        if sale.status != "Pending":
            raise SaleException(SaleExceptionInfo.SALE_NOT_PENDING)

        line = await self._sale_repo.get_line_by_id(sale_line_id)
        if line is None or line.sale_id != sale_id:
            raise SaleException(SaleExceptionInfo.SALE_LINE_NOT_FOUND)

        if len(sale.lines) <= 1:
            raise SaleException(SaleExceptionInfo.MINIMUM_ONE_LINE)

        await self._sale_repo.delete_line(sale_line_id)

        updated = await self._sale_repo.get_by_id(sale_id)
        subtotal = sum(ln.line_subtotal for ln in updated.lines)
        taxes = sum(ln.line_tax for ln in updated.lines)
        total = subtotal + taxes

        sale = await self._sale_repo.update_totals(sale_id, subtotal, taxes, total)
        setattr(
            sale,
            "client_name",
            await self._client_reader.get_name_by_id(sale.client_id),
        )
        setattr(
            sale, "creator_name", await self._user_reader.get_name_by_id(sale.user_id)
        )
        return sale
