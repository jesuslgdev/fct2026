from dataclasses import dataclass


@dataclass(frozen=True)
class ImportRowError:
    row: int
    reason: str


@dataclass(frozen=True)
class ImportResult:
    total: int
    created: int
    errors: list[ImportRowError]
