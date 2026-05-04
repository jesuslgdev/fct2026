from unittest.mock import AsyncMock

import pytest

from modules.sales.application.delete_sale_use_case import DeleteSaleUseCase
from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo
from tests.sales.conftest import make_sale


@pytest.mark.asyncio
async def test_delete_sale_when_pending_calls_repository_delete():
    repo = AsyncMock()
    repo.get_by_id.return_value = make_sale(status="Pending")
    use_case = DeleteSaleUseCase(repo)

    await use_case.execute(sale_id=1)

    repo.delete_sale.assert_awaited_once_with(1)


@pytest.mark.asyncio
async def test_delete_sale_when_not_found_raises_error():
    repo = AsyncMock()
    repo.get_by_id.return_value = None
    use_case = DeleteSaleUseCase(repo)

    with pytest.raises(SaleException) as exc_info:
        await use_case.execute(sale_id=1)

    assert exc_info.value.info == SaleExceptionInfo.SALE_NOT_FOUND
    repo.delete_sale.assert_not_called()


@pytest.mark.asyncio
async def test_delete_sale_when_not_pending_raises_error():
    repo = AsyncMock()
    repo.get_by_id.return_value = make_sale(status="Approved")
    use_case = DeleteSaleUseCase(repo)

    with pytest.raises(SaleException) as exc_info:
        await use_case.execute(sale_id=1)

    assert exc_info.value.info == SaleExceptionInfo.SALE_NOT_DELETABLE
    repo.delete_sale.assert_not_called()
