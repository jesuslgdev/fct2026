ROLE_PATTERN = r"^(Administrator|Manager|Employee)$"

USER_DELETED_PLACEHOLDER = "DELETED"
USER_DELETED_EMAIL_PREFIX = "deleted_"

TAX_ID_PATTERN = (
    r"^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J])$"
)
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
POSTAL_CODE_PATTERN = r"^\d{5}$"
PHONE_PATTERN = r"^\d{9}$"
