from dataclasses import dataclass


@dataclass
class ImportRowError:
    row: int
    reason: str


@dataclass
class ImportResult:
    total: int
    created: int
    errors: list[ImportRowError]
