from unittest.mock import AsyncMock, MagicMock

import pytest

from modules.purchases.application.cancel_purchase_use_case import CancelPurchaseUseCase
from modules.purchases.domain.exceptions import PurchaseException, PurchaseExceptionInfo


@pytest.mark.asyncio
async def test_cancel_purchase_registers_status_history():
    purchase = MagicMock()
    purchase.purchase_id = 10
    purchase.status = "Pending"

    cancelled = MagicMock()
    cancelled.purchase_id = 10
    cancelled.status = "Cancelled"

    repo = MagicMock()
    repo.get_by_id = AsyncMock(side_effect=[purchase, cancelled])
    repo.cancel_purchase = AsyncMock(return_value=cancelled)
    repo.add_status_history = AsyncMock()

    use_case = CancelPurchaseUseCase(repo)

    result = await use_case.execute(purchase_id=10, user_id=77)

    assert result == cancelled
    repo.cancel_purchase.assert_awaited_once_with(10, 77)
    repo.add_status_history.assert_awaited_once()

    history = repo.add_status_history.await_args.args[0]
    assert history.purchase_id == 10
    assert history.from_status == "Pending"
    assert history.to_status == "Cancelled"
    assert history.changed_by_user_id == 77


@pytest.mark.asyncio
async def test_cancel_purchase_rejects_non_cancellable_status():
    purchase = MagicMock()
    purchase.status = "Received"

    repo = MagicMock()
    repo.get_by_id = AsyncMock(return_value=purchase)
    repo.cancel_purchase = AsyncMock()
    repo.add_status_history = AsyncMock()

    use_case = CancelPurchaseUseCase(repo)

    with pytest.raises(PurchaseException) as exc_info:
        await use_case.execute(purchase_id=10, user_id=77)

    assert exc_info.value.info == PurchaseExceptionInfo.PURCHASE_NOT_CANCELLABLE
    repo.cancel_purchase.assert_not_awaited()
    repo.add_status_history.assert_not_awaited()
