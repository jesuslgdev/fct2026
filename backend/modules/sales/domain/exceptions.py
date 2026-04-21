from shared.exceptions import AppException, AppExceptionInfo


class SaleExceptionInfo(AppExceptionInfo):
    """Error codes for the sales module (8xxx range).

    Numbering convention:
      8xxx  sales
        81xx  sales
    """

    SALE_NOT_FOUND = (8101, "Sale not found", 404)
    CLIENT_NOT_FOUND = (8102, "Client not found", 404)
    CLIENT_NOT_ACTIVE = (8103, "Client is not active", 422)
    PRODUCT_NOT_FOUND = (8104, "Product not found", 404)
    PRODUCT_NOT_ACTIVE = (8105, "Product is not active", 422)
    INSUFFICIENT_STOCK = (8106, "Insufficient stock for product", 422)
    EMPTY_SALE_LINES = (8107, "At least one sale line is required", 422)
    SALE_INVALID_TRANSITION = (8108, "Invalid sale status transition", 422)
    SALE_TERMINAL_STATE = (8109, "Sale is in a terminal state", 422)
    WAREHOUSE_NOT_FOUND = (8110, "Warehouse not found", 404)
    SALE_NOT_PENDING = (8111, "Sale must be in Pending status to be edited", 400)
    DELIVERY_ADDRESS_REQUIRED = (8112, "Delivery address is required", 422)
    SALE_NOT_DELETABLE = (8113, "Only pending sales can be deleted", 400)


class SaleException(AppException):
    pass
