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
    SUPPLIER_INVALID_TAX_ID = (3103, "Invalid tax ID format", 422)
    SUPPLIER_EMAIL_ALREADY_EXISTS = (
        3104,
        "Supplier with this email already exists",
        409,
    )

    # Supplier-Products (32xx)
    ASSOCIATION_NOT_FOUND = (3201, "Supplier-product association not found", 404)
    ASSOCIATION_ALREADY_EXISTS = (
        3202,
        "Supplier-product association already exists",
        409,
    )
    SUPPLIER_NOT_ACTIVE = (3203, "Supplier is not active", 409)
    PRODUCT_NOT_ACTIVE = (3204, "Product is not active", 409)
    PRODUCT_NOT_FOUND = (3205, "Product not found", 404)
    INVALID_SUPPLIER_PRICE = (3206, "Supplier price must be greater than zero", 422)


class SupplierException(AppException):
    pass
