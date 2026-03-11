from dataclasses import dataclass


@dataclass
class PaginatedResult[T]:
    items: list[T]
    total: int
    page: int
    page_size: int
