from dataclasses import dataclass


@dataclass(frozen=True)
class Address:
    street: str
    city: str
    province: str
    postal_code: str

    def __composite_values__(self) -> tuple[str, str, str, str]:
        return (self.street, self.city, self.province, self.postal_code)
