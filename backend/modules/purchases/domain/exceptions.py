from shared.exceptions import AppException, AppExceptionInfo


class PurchaseExceptionInfo(AppExceptionInfo):
    """Error codes for the purchases module (7xxx range).

    Numbering convention:
      7xxx  purchases
        71xx  purchases
    """

    PURCHASE_NOT_FOUND = (7101, "Purchase not found", 404)


class PurchaseException(AppException):
    pass
