from shared.exceptions import AppException, AppExceptionInfo


class PurchaseExceptionInfo(AppExceptionInfo):
    """Error codes for the purchases module (7xxx range).

    Numbering convention:
      7xxx  purchases
        71xx  purchases
    """

    PURCHASE_NOT_FOUND = (7101, "Purchase not found", 404)
    SUPPLIER_NOT_ACTIVE = (7102, "Supplier is not active", 400)
    PRODUCT_NOT_FOUND = (7103, "Product not found", 404)
    PRODUCT_NOT_ACTIVE = (7104, "Product is not active", 400)
    PRODUCT_NOT_LINKED = (7105, "Product is not linked to the selected supplier", 400)
    PURCHASE_NO_LINES = (7106, "At least one purchase line is required", 400)
    INVALID_DISCOUNT = (7107, "Discount cannot exceed line subtotal", 400)


class PurchaseException(AppException):
    pass
