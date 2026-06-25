from shared.exceptions import AppException, AppExceptionInfo


class ClientExceptionInfo(AppExceptionInfo):
    CLIENT_NOT_FOUND = (4101, "Client not found", 404)
    CLIENT_ALREADY_EXISTS = (4102, "A client with this tax ID already exists", 409)
    CLIENT_INVALID_TAX_ID = (4103, "Invalid Spanish NIF/NIE/CIF format", 422)
    CLIENT_EMAIL_ALREADY_EXISTS = (
        4104,
        "A client with this email already exists",
        409,
    )


class ClientException(AppException):
    pass
