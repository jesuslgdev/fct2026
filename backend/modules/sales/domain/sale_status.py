"""Sale status constants and transition rules."""

PENDING = "Pending"
APPROVED = "Approved"
IN_PROCESS = "InProcess"
SHIPPED = "Shipped"
DELIVERED = "Delivered"
CANCELLED = "Cancelled"

# Maps each status to the set of statuses it can transition to.
VALID_TRANSITIONS: dict[str, set[str]] = {
    PENDING: {APPROVED, CANCELLED},
    APPROVED: {IN_PROCESS, CANCELLED},
    IN_PROCESS: {SHIPPED},
    SHIPPED: {DELIVERED},
    DELIVERED: set(),
    CANCELLED: set(),
}


def allowed_next(status: str) -> list[str]:
    """Return the list of statuses reachable from *status*.

    Returns an empty list for terminal states (Delivered, Cancelled) or for
    unknown status values.
    """
    return sorted(VALID_TRANSITIONS.get(status, set()))
