from enum import Enum


class AppExceptionInfo(Enum):
    """Base enum for structured application exceptions.

    Each member is defined as (error_code, message, http_status).
    Subclass this per module to define domain-specific error codes.
    """

    def __new__(cls, code: int, message: str, http_status: int):
        obj = object.__new__(cls)
        obj._value_ = code
        obj.code = code
        obj.message = message
        obj.http_status = http_status
        return obj


class AppException(Exception):
    """Raised by use cases and repositories to signal a known domain error.

    Caught by the global exception handler in main.py, which converts it to
    a JSON response with shape: {"error_code": <int>, "detail": <str>}.
    """

    def __init__(self, info: AppExceptionInfo) -> None:
        self.info = info
        super().__init__(info.message)
