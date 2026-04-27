"""Purchase status constants and transition rules."""

PENDING = "Pending"
APPROVED = "Approved"
IN_PROCESS = "In Process"
SENT = "Sent"
RECEIVED = "Received"
CANCELLED = "Cancelled"

VALID_TRANSITIONS: dict[str, set[str]] = {
    PENDING: {APPROVED, CANCELLED},
    APPROVED: {IN_PROCESS, CANCELLED},
    IN_PROCESS: {SENT},
    SENT: {RECEIVED},
    RECEIVED: set(),
    CANCELLED: set(),
}


def allowed_next(status: str) -> list[str]:
    """Return the list of statuses reachable from *status*."""
    return sorted(VALID_TRANSITIONS.get(status, set()))
