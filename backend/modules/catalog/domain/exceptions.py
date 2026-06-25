from shared.exceptions import AppException, AppExceptionInfo


class CatalogExceptionInfo(AppExceptionInfo):
    """Error codes for the catalog module (5xxx range).

    Numbering convention:
      5xxx  catalog
        51xx  categories
        52xx  products

    Other modules use their own ranges, e.g.:
      1xxx  admin
      2xxx  auth
      3xxx  suppliers
      4xxx  clients
      6xxx  warehouse
      7xxx  purchases
      8xxx  sales
    """

    # Categories (51xx)
    CATEGORY_NOT_FOUND = (5101, "Category not found", 404)
    CATEGORY_ALREADY_EXISTS = (5102, "Category name already exists", 409)
    CATEGORY_HAS_PRODUCTS = (5103, "Category has associated products", 409)

    # Products (52xx)
    PRODUCT_NOT_FOUND = (5201, "Product not found", 404)
    PRODUCT_CODE_ALREADY_EXISTS = (5202, "Product code already exists", 409)
    PRODUCT_NAME_ALREADY_EXISTS = (5203, "Product name already exists", 409)


class CatalogException(AppException):
    """Raised by catalog use cases and repositories to signal a domain error."""

    pass
