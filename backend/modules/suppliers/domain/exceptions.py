from shared.exceptions import AppException, AppExceptionInfo


class SupplierExceptionInfo(AppExceptionInfo):
    """Error codes for the suppliers module (3xxx range).

    Numbering convention:
      3xxx  suppliers
        31xx  suppliers
    """

    # Suppliers (31xx)
    SUPPLIER_NOT_FOUND = (3101, "Supplier not found", 404)
    SUPPLIER_ALREADY_EXISTS = (3102, "Supplier with this tax ID already exists", 409)


class SupplierException(AppException):
    pass
