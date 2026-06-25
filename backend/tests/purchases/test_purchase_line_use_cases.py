from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from modules.purchases.application.add_purchase_line_use_case import (
    AddPurchaseLineUseCase,
)
from modules.purchases.application.delete_purchase_line_use_case import (
    DeletePurchaseLineUseCase,
)
from modules.purchases.application.update_purchase_line_use_case import (
    UpdatePurchaseLineUseCase,
)
from tests.purchases.conftest import make_purchase, make_purchase_line


@pytest.mark.asyncio
async def test_add_purchase_line_sets_vat_and_recalculates_taxes_from_lines():
    purchase_repo = MagicMock()
    supplier_reader = MagicMock()
    product_reader = MagicMock()

    purchase_repo.get_by_id = AsyncMock(
        side_effect=[
            make_purchase(status="Pending", supplier_id=5),
            make_purchase(
                status="Pending",
                lines=[
                    make_purchase_line(
                        purchase_line_id=1,
                        line_subtotal=Decimal("100.00"),
                        vat_rate=Decimal("0.21"),
                        line_tax=Decimal("21.00"),
                    ),
                    make_purchase_line(
                        purchase_line_id=2,
                        line_subtotal=Decimal("50.00"),
                        vat_rate=Decimal("0.10"),
                        line_tax=Decimal("5.00"),
                    ),
                ],
            ),
        ]
    )
    purchase_repo.add_line = AsyncMock()
    purchase_repo.update_totals = AsyncMock(return_value=make_purchase())

    supplier_reader.get_association = AsyncMock(return_value=object())
    product_reader.get_by_id = AsyncMock(
        return_value=MagicMock(is_active=True, vat_rate=Decimal("0.10"))
    )

    use_case = AddPurchaseLineUseCase(purchase_repo, supplier_reader, product_reader)

    await use_case.execute(
        purchase_id=1,
        product_id=10,
        quantity=2,
        unit_price=Decimal("30.00"),
        discount=Decimal("10.00"),
    )

    purchase_repo.add_line.assert_awaited_once_with(
        purchase_id=1,
        product_id=10,
        quantity=2,
        unit_price=Decimal("30.00"),
        discount=Decimal("10.00"),
        line_subtotal=Decimal("50.00"),
        vat_rate=Decimal("0.10"),
        line_tax=Decimal("5.00"),
    )
    purchase_repo.update_totals.assert_awaited_once_with(
        purchase_id=1,
        subtotal=Decimal("150.00"),
        taxes=Decimal("26.00"),
        total=Decimal("176.00"),
    )


@pytest.mark.asyncio
async def test_update_purchase_line_recalculates_line_tax_and_purchase_taxes():
    purchase_repo = MagicMock()
    purchase_repo.get_by_id = AsyncMock(
        side_effect=[
            make_purchase(status="Pending"),
            make_purchase(
                status="Pending",
                lines=[
                    make_purchase_line(
                        purchase_line_id=1,
                        line_subtotal=Decimal("80.00"),
                        vat_rate=Decimal("0.04"),
                        line_tax=Decimal("3.20"),
                    ),
                    make_purchase_line(
                        purchase_line_id=2,
                        line_subtotal=Decimal("100.00"),
                        vat_rate=Decimal("0.21"),
                        line_tax=Decimal("21.00"),
                    ),
                ],
            ),
        ]
    )
    purchase_repo.get_line_by_id = AsyncMock(
        return_value=make_purchase_line(
            purchase_line_id=1,
            purchase_id=1,
            vat_rate=Decimal("0.04"),
        )
    )
    purchase_repo.update_line = AsyncMock()
    purchase_repo.update_totals = AsyncMock(return_value=make_purchase())

    use_case = UpdatePurchaseLineUseCase(purchase_repo)

    await use_case.execute(
        purchase_id=1,
        purchase_line_id=1,
        quantity=5,
        unit_price=Decimal("20.00"),
        discount=Decimal("20.00"),
    )

    purchase_repo.update_line.assert_awaited_once_with(
        purchase_line_id=1,
        quantity=5,
        unit_price=Decimal("20.00"),
        discount=Decimal("20.00"),
        line_subtotal=Decimal("80.00"),
        vat_rate=Decimal("0.04"),
        line_tax=Decimal("3.20"),
    )
    purchase_repo.update_totals.assert_awaited_once_with(
        purchase_id=1,
        subtotal=Decimal("180.00"),
        taxes=Decimal("24.20"),
        total=Decimal("204.20"),
    )


@pytest.mark.asyncio
async def test_delete_purchase_line_recalculates_taxes_from_remaining_line_tax():
    purchase_repo = MagicMock()
    purchase_repo.get_by_id = AsyncMock(
        side_effect=[
            make_purchase(
                status="Pending",
                lines=[
                    make_purchase_line(purchase_line_id=1),
                    make_purchase_line(purchase_line_id=2),
                ],
            ),
            make_purchase(
                status="Pending",
                lines=[
                    make_purchase_line(
                        purchase_line_id=2,
                        line_subtotal=Decimal("100.00"),
                        vat_rate=Decimal("0.04"),
                        line_tax=Decimal("4.00"),
                    )
                ],
            ),
        ]
    )
    purchase_repo.get_line_by_id = AsyncMock(
        return_value=make_purchase_line(purchase_line_id=1, purchase_id=1)
    )
    purchase_repo.delete_line = AsyncMock()
    purchase_repo.update_totals = AsyncMock(return_value=make_purchase())

    use_case = DeletePurchaseLineUseCase(purchase_repo)

    await use_case.execute(purchase_id=1, purchase_line_id=1)

    purchase_repo.delete_line.assert_awaited_once_with(1)
    purchase_repo.update_totals.assert_awaited_once_with(
        purchase_id=1,
        subtotal=Decimal("100.00"),
        taxes=Decimal("4.00"),
        total=Decimal("104.00"),
    )
