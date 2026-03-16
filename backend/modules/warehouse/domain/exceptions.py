from shared.exceptions import AppException, AppExceptionInfo


class WarehouseExceptionInfo(AppExceptionInfo):
    """Error codes for the warehouse module (6xxx range).

    Numbering convention:
      6xxx  warehouse
        61xx  warehouses
        62xx  stock

    Other modules use their own ranges, e.g.:
      1xxx  admin
      2xxx  auth
      3xxx  suppliers
      4xxx  clients
      5xxx  catalog
      7xxx  purchases
      8xxx  sales
    """

    # Warehouses (61xx)
    WAREHOUSE_NOT_FOUND = (6101, "Warehouse not found", 404)

    # Stock (62xx)
    PRODUCT_NOT_FOUND = (6201, "Product not found", 404)
    INSUFFICIENT_STOCK = (6202, "Insufficient stock", 409)


class WarehouseException(AppException):
    """Raised by warehouse use cases and repositories to signal a domain error."""

    pass
