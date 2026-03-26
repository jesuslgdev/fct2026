from dataclasses import dataclass


@dataclass(frozen=True)
class PaginatedResult[T]:
    items: list[T]
    total: int
    page: int
    page_size: int
