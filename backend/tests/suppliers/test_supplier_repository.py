import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.exceptions import SupplierException
from modules.suppliers.infrastructure.repos.supplier_repository import (
    SupplierRepository,
)


def _make_supplier(**kwargs) -> Supplier:
    defaults = {
        "name": "Proveedor Test S.L.",
        "tax_id": "B12345674",
        "address": "Calle Mayor 1",
        "city": "Madrid",
        "province": "Madrid",
        "postal_code": "28001",
        "phone": "910000000",
        "email": "test@test.com",
    }
    defaults.update(kwargs)
    return Supplier(**defaults)


async def test_get_existing_tax_ids_empty(db_session: AsyncSession):
    repo = SupplierRepository(db_session)
    result = await repo.get_existing_tax_ids(["B12345674", "A98765432"])
    assert result == set()


async def test_get_existing_tax_ids_returns_matches(db_session: AsyncSession):
    repo = SupplierRepository(db_session)
    await repo.bulk_create([_make_supplier(tax_id="B12345674")])
    result = await repo.get_existing_tax_ids(["B12345674", "A00000000"])
    assert result == {"B12345674"}


async def test_bulk_create_returns_count(db_session: AsyncSession):
    repo = SupplierRepository(db_session)
    suppliers = [
        _make_supplier(
            tax_id="B11111111",
            name="Proveedor A",
            phone="910000001",
            email="a@test.com",
        ),
        _make_supplier(
            tax_id="B22222222",
            name="Proveedor B",
            city="Barcelona",
            province="Barcelona",
            postal_code="08001",
            phone="930000001",
            email="b@test.com",
        ),
    ]
    count = await repo.bulk_create(suppliers)
    assert count == 2


async def test_bulk_create_persists_supplier(db_session: AsyncSession):
    repo = SupplierRepository(db_session)
    await repo.bulk_create([_make_supplier(tax_id="B33333333")])
    existing = await repo.get_existing_tax_ids(["B33333333"])
    assert "B33333333" in existing


async def test_get_all_paginated_returns_items(db_session: AsyncSession):
    repo = SupplierRepository(db_session)
    await repo.bulk_create(
        [
            _make_supplier(tax_id="B44444444", name="Proveedor A"),
            _make_supplier(tax_id="B55555555", name="Proveedor B"),
        ]
    )
    result = await repo.get_all_paginated(page=1, page_size=10)
    assert result.total >= 2
    assert len(result.items) >= 2


async def test_get_all_paginated_respects_page_size(db_session: AsyncSession):
    repo = SupplierRepository(db_session)
    await repo.bulk_create(
        [
            _make_supplier(tax_id="B66666666", name="Proveedor C"),
            _make_supplier(tax_id="B77777777", name="Proveedor D"),
            _make_supplier(tax_id="B88888888", name="Proveedor E"),
        ]
    )
    result = await repo.get_all_paginated(page=1, page_size=2)
    assert len(result.items) <= 2


async def test_update_not_found_raises(db_session: AsyncSession):
    repo = SupplierRepository(db_session)
    with pytest.raises(SupplierException):
        await repo.update(
            supplier_id=99999,
            name="X",
            address=None,
            city=None,
            province=None,
            postal_code=None,
            phone=None,
            email=None,
        )


async def test_set_active_not_found_raises(db_session: AsyncSession):
    repo = SupplierRepository(db_session)
    with pytest.raises(SupplierException):
        await repo.set_active(supplier_id=99999, is_active=False)
