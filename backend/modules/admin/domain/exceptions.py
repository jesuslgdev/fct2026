from shared.exceptions import AppException, AppExceptionInfo


class AdminExceptionInfo(AppExceptionInfo):
    """Error codes for the admin module (1xxx range).

    Numbering convention:
      1xxx  admin
        11xx  departments
        12xx  users

    Other modules must use their own range, e.g.:
      2xxx  auth
      3xxx  suppliers
      4xxx  clients
      5xxx  catalog
      6xxx  warehouse
      7xxx  purchases
      8xxx  sales
    """

    # Departments (11xx)
    DEPARTMENT_NOT_FOUND = (1101, "Department not found", 404)
    DEPARTMENT_HAS_USERS = (1102, "Department has associated users", 409)
    DEPARTMENT_ALREADY_EXISTS = (1103, "Department name already exists", 409)

    # Users (12xx)
    USER_NOT_FOUND = (1201, "User not found", 404)
    USER_ALREADY_EXISTS = (1202, "User with this email already exists", 409)
    USER_DEPARTMENT_NOT_FOUND = (1203, "Department not found", 404)
    USER_DEPARTMENT_REQUIRED = (
        1204,
        "Department is required for Manager and Employee roles",
        422,
    )
    USER_HAS_REFERENCES = (
        1205,
        "User has associated records and cannot be deleted",
        409,
    )
    USER_ALREADY_ACTIVE = (1206, "User is already active", 409)
    USER_ALREADY_INACTIVE = (1207, "User is already inactive", 409)
    USER_IS_DELETED = (
        1208,
        "User has been deleted and cannot be modified",
        409,
    )


class AdminException(AppException):
    pass
