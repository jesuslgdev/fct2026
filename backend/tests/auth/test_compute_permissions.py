import pytest

from modules.auth.application.login_use_case import _compute_permissions


@pytest.mark.parametrize(
    "role, department_name, expected",
    [
        # Administrator always gets all permissions regardless of department
        (
            "Administrator",
            None,
            ["admin", "purchases_manager", "sales_manager", "purchases_department"],
        ),
        (
            "Administrator",
            "Purchases",
            ["admin", "purchases_manager", "sales_manager", "purchases_department"],
        ),
        (
            "Administrator",
            "Sales",
            ["admin", "purchases_manager", "sales_manager", "purchases_department"],
        ),
        # Manager in Purchases gets purchases_manager + purchases_department
        ("Manager", "Purchases", ["purchases_manager", "purchases_department"]),
        # Manager in Sales gets sales_manager only
        ("Manager", "Sales", ["sales_manager"]),
        # Manager with no department or unrecognised department gets nothing
        ("Manager", None, []),
        ("Manager", "HR", []),
        # Employee in Purchases gets purchases_department only
        ("Employee", "Purchases", ["purchases_department"]),
        # Employee in Sales gets nothing — will change when Ventas module is implemented
        ("Employee", "Sales", []),
        ("Employee", None, []),
    ],
)
def test_compute_permissions(
    role: str, department_name: str | None, expected: list[str]
):
    assert _compute_permissions(role, department_name) == expected
