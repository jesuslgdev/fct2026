from decimal import Decimal

from modules.sales.domain.exceptions import SaleException, SaleExceptionInfo


def normalize_discount_to_rate(
    discount: Decimal,
    discount_type: str,
    unit_price: Decimal,
    quantity: int,
) -> Decimal:
    if discount_type == "percent":
        rate = discount / Decimal("100")
    else:
        gross = unit_price * quantity
        if gross == 0:
            return Decimal("0")
        rate = discount / gross
    if rate >= Decimal("1"):
        raise SaleException(SaleExceptionInfo.INVALID_DISCOUNT)
    return rate
