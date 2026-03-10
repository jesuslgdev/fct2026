FCT2026/
│
└── backend/
    ├── .github/                                        # CI/CD with GitHub Actions
    │   └── workflows/
    │       ├── ci.yml                                  # Lint (Ruff) + tests (pytest) on every push/PR
    │       └── deploy.yml                              # Auto deploy to Render on merge to main
    │
    ├── alembic/                                        # Database migrations (equivalent to EF Migrations)
    │   ├── env.py                                      # Config: points to SQLAlchemy models in shared
    │   └── versions/                                   # Auto-generated migration files
    │
    ├── alembic.ini                                     # PostgreSQL connection config (Render)
    │
    ├── .env.example                                    # Environment variable template (no real values)
    │                                                   # DATABASE_URL, FIREBASE_CREDENTIALS_JSON, ENVIRONMENT, etc.
    │                                                   # Real .env NOT versioned (in .gitignore)
    │                                                   # On Render: variables configured in service dashboard
    │
    ├── pyproject.toml                                  # Project dependencies and tool configuration
    │                                                   # [project.dependencies]
    │                                                   #   fastapi, uvicorn[standard], sqlalchemy, alembic,
    │                                                   #   psycopg[binary], firebase-admin,
    │                                                   #   pydantic, pydantic-settings, openpyxl
    │                                                   # [project.optional-dependencies]
    │                                                   #   dev = [ruff, pytest, pytest-asyncio, httpx]
    │                                                   # [tool.ruff]   — lint rules
    │                                                   # [tool.pytest.ini_options] — test configuration
    │
    ├── shared/                                         # Shared core used by all modules
    │   │
    │   ├── config.py                                   # Settings (pydantic-settings)
    │   │                                               # class Settings(BaseSettings):
    │   │                                               #     DATABASE_URL: str     # postgresql+psycopg://...
    │   │                                               #     FIREBASE_CREDENTIALS_JSON: str
    │   │                                               #     ENVIRONMENT: str      # "development" | "production"
    │   │                                               # + get_settings() -> Settings  # cached with @lru_cache
    │   │
    │   ├── domain/
    │   │   ├── entities/
    │   │   │   ├── base_entity.py
    │   │   │   │   - int id
    │   │   │   │   - datetime created_at
    │   │   │   │   - datetime updated_at
    │   │   │   │
    │   │   │   ├── user.py                             # ORM User model (table: "users")
    │   │   │   │   - int id
    │   │   │   │   - str first_name
    │   │   │   │   - str last_name
    │   │   │   │   - str email
    │   │   │   │   - str role                          # "Administrator" | "Manager" | "Employee"
    │   │   │   │   - int department_id
    │   │   │   │   - bool is_active
    │   │   │   │   - str firebase_uid
    │   │   │   │   - datetime created_at
    │   │   │   │   - datetime updated_at
    │   │   │   │
    │   │   │   └── user_session.py                     # UserSession dataclass (used by security.py + all routers)
    │   │   │       - str email
    │   │   │       - str role
    │   │   │       - int department_id
    │   │   │       - str firebase_uid
    │   │   │
    │   │   ├── interfaces/                             # Cross-module shared contracts — no circular deps
    │   │   │   ├── __init__.py
    │   │   │   │
    │   │   │   ├── i_product_reader.py                 # Read-only product data for external consumers
    │   │   │   │   + get_by_id(id: int) -> Product
    │   │   │   │   + get_name_by_id(id: int) -> str
    │   │   │   │   + get_min_stock(id: int) -> int
    │   │   │   │
    │   │   │   ├── i_stock_service.py                  # Stock operations for purchases/sales/catalog
    │   │   │   │   + get_global_stock(product_id: int) -> int
    │   │   │   │   + get_available_stock(product_id: int) -> int
    │   │   │   │   + reserve_stock(product_id: int, quantity: int) -> None
    │   │   │   │   + release_stock(product_id: int, quantity: int) -> None
    │   │   │   │   + register_entry(product_id: int, warehouse_id: int, quantity: int, reference: str) -> None
    │   │   │   │   + register_exit(product_id: int, warehouse_id: int, quantity: int, reference: str) -> None
    │   │   │   │   + get_products_below_min_stock() -> list[ProductStockInfo]
    │   │   │   │
    │   │   │   ├── i_warehouse_reader.py               # Read-only warehouse data for purchases
    │   │   │   │   + get_all() -> list[Warehouse]
    │   │   │   │   + get_by_id(id: int) -> Warehouse
    │   │   │   │   + exists(id: int) -> bool
    │   │   │   │
    │   │   │   ├── i_supplier_reader.py                # Read-only supplier data for purchases
    │   │   │   │   + get_by_id(id: int) -> Supplier
    │   │   │   │   + get_name_by_id(id: int) -> str
    │   │   │   │
    │   │   │   ├── i_client_reader.py                  # Read-only client data for sales
    │   │   │   │   + get_by_id(id: int) -> Client
    │   │   │   │   + get_name_by_id(id: int) -> str
    │   │   │   │
    │   │   │   ├── i_user_reader.py                    # Read-only user data for purchases/sales
    │   │   │   │   + get_name_by_id(id: int) -> str
    │   │   │   │
    │   │   │   ├── i_purchase_reader.py                # Read-only purchase data for dashboard
    │   │   │   │   + get_latest(limit: int) -> list[Purchase]
    │   │   │   │   + get_by_status(status: str) -> list[Purchase]
    │   │   │   │   + get_spend_by_month(year: int, month: int) -> Decimal
    │   │   │   │
    │   │   │   └── i_sale_reader.py                    # Read-only sale data for dashboard
    │   │   │       + get_latest(limit: int) -> list[Sale]
    │   │   │       + get_by_status(status: str) -> list[Sale]
    │   │   │       + get_revenue_by_month(year: int, month: int) -> Decimal
    │   │   │
    │   │   └── paginated_result.py                     # PaginatedResult[T] generic dataclass
    │   │       - list[T] items
    │   │       - int total
    │   │       - int page
    │   │       - int page_size
    │   │
    │   └── infrastructure/
    │       ├── database/
    │       │   ├── connection.py                       # SQLAlchemy async engine + session factory
    │       │   │   + get_db() -> AsyncGenerator[AsyncSession]  # Dependency for repo injection
    │       │   │                                       # Uses settings.DATABASE_URL (postgresql+psycopg://...)
    │       │   ├── base_model.py                       # DeclarativeBase shared by all ORM models
    │       │   └── seed.py                             # Initial data seed (roles, default admin user)
    │       │
    │       └── security/
    │           ├── firebase_client.py                  # Firebase Admin SDK initialization
    │           │   + init_firebase_app() -> None       # Called on startup; reads FIREBASE_CREDENTIALS_JSON
    │           │
    │           └── firebase_auth_provider.py           # Firebase token operations
    │               + verify_firebase_token(id_token: str) -> dict
    │                 # Validates ID Token against Firebase Admin SDK
    │                 # Returns claims: uid, email, email_verified, ...
    │                 # Raises exception if token is invalid or expired
    │               + revoke_firebase_tokens(uid: str) -> None
    │                 # Revokes all Firebase tokens for a user (logout)
    │
    ├── modules/
    │   │
    │   │
    │   ├── auth/                                       # HU-01, HU-02 — Login/Logout with Firebase Auth
    │   │   │                                           # SYSTEM ROLES:
    │   │   │                                           #   "Administrator" — Full access to all modules and endpoints.
    │   │   │                                           #                     System superadmin (user/department management).
    │   │   │                                           #   "Manager"       — Access to operations and reports,
    │   │   │                                           #                     no user/department management.
    │   │   │                                           #   "Employee"      — Limited access per module.
    │   │   │                                           # Flow: Frontend authenticates with Firebase (Google or others)
    │   │   │                                           # and gets an ID Token. Backend validates it with
    │   │   │                                           # Firebase Admin SDK on every request.
    │   │   ├── domain/
    │   │   │   └── interfaces/
    │   │   │       ├── repositories/
    │   │   │       │   └── i_auth_repository.py
    │   │   │       │       + find_active_user_by_firebase_uid(uid: str) -> User | None
    │   │   │       │       + find_active_user_by_email(email: str) -> User | None
    │   │   │       │       + revoke_tokens(firebase_uid: str) -> None
    │   │   │       │
    │   │   │       └── use_cases/
    │   │   │           ├── i_login_use_case.py
    │   │   │           │   + execute(firebase_id_token: str) -> User
    │   │   │           └── i_logout_use_case.py
    │   │   │               + execute(firebase_uid: str) -> None
    │   │   │
    │   │   ├── application/
    │   │   │   ├── login_use_case.py
    │   │   │   │   - IAuthRepository auth_repository
    │   │   │   │   + __init__(auth_repository: IAuthRepository)
    │   │   │   │   + execute(firebase_id_token: str) -> User
    │   │   │   │     # 1. Validates ID Token with firebase_auth_provider.verify_firebase_token()
    │   │   │   │     # 2. Extracts email and uid from token claims
    │   │   │   │     # 3. Finds user in DB by email (must exist and be active)
    │   │   │   │     # 4. Returns User entity; router maps to LoginResponseDTO
    │   │   │   │     #    Firebase ID Token is the session token; no custom JWT generated
    │   │   │   │
    │   │   │   └── logout_use_case.py
    │   │   │       - IAuthRepository auth_repository
    │   │   │       + __init__(auth_repository: IAuthRepository)
    │   │   │       + execute(firebase_uid: str) -> None
    │   │   │         # Revokes Firebase tokens for the user (invalidates all sessions)
    │   │   │         # Subsequent requests with old tokens will be rejected by verify_firebase_token
    │   │   │
    │   │   └── infrastructure/
    │   │       ├── repos/
    │   │       │   └── auth_repository.py
    │   │       │       - AsyncSession db
    │   │       │       + __init__(db: AsyncSession)
    │   │       │       + find_active_user_by_firebase_uid(uid: str) -> User | None
    │   │       │       + find_active_user_by_email(email: str) -> User | None
    │   │       │       + revoke_tokens(firebase_uid: str) -> None
    │   │       │
    │   │       └── http/
    │   │           ├── router.py                       # APIRouter prefix="/auth"
    │   │           │   # Use cases wired via composition/dependencies.py
    │   │           │   + POST /login
    │   │           │   #   user = await login_use_case.execute(body.firebase_id_token)
    │   │           │   #   return LoginResponseDTO(role=user.role, department_id=user.department_id,
    │   │           │   #                           name=f"{user.first_name} {user.last_name}")
    │   │           │   + POST /logout
    │   │           │   #   Requires: Depends(get_current_user) from composition/security.py
    │   │           │   #   await logout_use_case.execute(current_user.firebase_uid)
    │   │           │
    │   │           └── schemas.py                      # HTTP request/response DTOs
    │   │               LoginRequestDTO
    │   │               + str firebase_id_token          # ID Token obtained by frontend from Firebase
    │   │               LoginResponseDTO
    │   │               + str role
    │   │               + int department_id
    │   │               + str name
    │   │               # The Firebase ID Token continues as Bearer in subsequent requests
    │   │               # No custom ERP token is returned
    │
    │
    │   ├── admin/                                      # HU-03, HU-04 — Departments and Users
    │   │   │
    │   │   ├── domain/
    │   │   │   ├── entities/
    │   │   │   │   └── department.py
    │   │   │   │       - int id
    │   │   │   │       - str name
    │   │   │   │       + __init__(id, name)
    │   │   │   │
    │   │   │   └── interfaces/
    │   │   │       ├── repositories/
    │   │   │       │   ├── i_department_repository.py
    │   │   │       │   │   + get_all() -> list[Department]
    │   │   │       │   │   + get_by_id(id: int) -> Department
    │   │   │       │   │   + create(name: str) -> Department
    │   │   │       │   │   + update(id: int, name: str) -> Department
    │   │   │       │   │   + delete(id: int) -> None               # Only if no users linked
    │   │   │       │   │   + has_users(id: int) -> bool
    │   │   │       │   │
    │   │   │       │   └── i_user_repository.py
    │   │   │       │       + get_all_paginated(page: int, page_size: int) -> PaginatedResult[User]
    │   │   │       │       + get_by_id(id: int) -> User
    │   │   │       │       + get_by_email(email: str) -> User | None
    │   │   │       │       + create(data: CreateUserDTO) -> User
    │   │   │       │       + update(id: int, data: UpdateUserDTO) -> User
    │   │   │       │       + set_active(id: int, is_active: bool) -> None
    │   │   │       │
    │   │   │       └── use_cases/
    │   │   │           ├── departments/
    │   │   │           │   ├── i_list_departments_use_case.py
    │   │   │           │   │   + execute() -> list[Department]
    │   │   │           │   ├── i_get_department_use_case.py
    │   │   │           │   │   + execute(id: int) -> Department
    │   │   │           │   ├── i_create_department_use_case.py
    │   │   │           │   │   + execute(name: str) -> Department
    │   │   │           │   ├── i_update_department_use_case.py
    │   │   │           │   │   + execute(id: int, name: str) -> Department
    │   │   │           │   └── i_delete_department_use_case.py
    │   │   │           │       + execute(id: int) -> None
    │   │   │           │
    │   │   │           └── users/
    │   │   │               ├── i_list_users_use_case.py
    │   │   │               │   + execute(page: int, page_size: int) -> PaginatedResult[User]
    │   │   │               ├── i_get_user_use_case.py
    │   │   │               │   + execute(id: int) -> User
    │   │   │               ├── i_create_user_use_case.py
    │   │   │               │   + execute(data: CreateUserDTO) -> User
    │   │   │               ├── i_update_user_use_case.py
    │   │   │               │   + execute(id: int, data: UpdateUserDTO) -> User
    │   │   │               └── i_set_user_active_use_case.py
    │   │   │                   + execute(id: int, is_active: bool) -> None
    │   │   │
    │   │   ├── application/
    │   │   │   ├── departments/
    │   │   │   │   ├── list_departments_use_case.py
    │   │   │   │   │   - IDepartmentRepository department_repository
    │   │   │   │   │   + execute() -> list[Department]
    │   │   │   │   ├── get_department_use_case.py
    │   │   │   │   │   - IDepartmentRepository department_repository
    │   │   │   │   │   + execute(id: int) -> Department
    │   │   │   │   ├── create_department_use_case.py
    │   │   │   │   │   - IDepartmentRepository department_repository
    │   │   │   │   │   + execute(name: str) -> Department
    │   │   │   │   ├── update_department_use_case.py
    │   │   │   │   │   - IDepartmentRepository department_repository
    │   │   │   │   │   + execute(id: int, name: str) -> Department
    │   │   │   │   └── delete_department_use_case.py
    │   │   │   │       - IDepartmentRepository department_repository
    │   │   │   │       + execute(id: int) -> None
    │   │   │   │         # Raises error if department has linked users
    │   │   │   │
    │   │   │   └── users/
    │   │   │       ├── list_users_use_case.py
    │   │   │       │   - IUserRepository user_repository
    │   │   │       │   + execute(page: int, page_size: int) -> PaginatedResult[User]
    │   │   │       ├── get_user_use_case.py
    │   │   │       │   - IUserRepository user_repository
    │   │   │       │   + execute(id: int) -> User
    │   │   │       ├── create_user_use_case.py
    │   │   │       │   - IUserRepository user_repository
    │   │   │       │   - IDepartmentRepository department_repository
    │   │   │       │   + execute(data: CreateUserDTO) -> User
    │   │   │       │     # Validates unique email, existing department, active by default
    │   │   │       ├── update_user_use_case.py
    │   │   │       │   - IUserRepository user_repository
    │   │   │       │   - IDepartmentRepository department_repository
    │   │   │       │   + execute(id: int, data: UpdateUserDTO) -> User
    │   │   │       └── set_user_active_use_case.py
    │   │   │           - IUserRepository user_repository
    │   │   │           + execute(id: int, is_active: bool) -> None
    │   │   │             # On deactivate: revokes Firebase tokens via firebase_auth_provider
    │   │   │
    │   │   └── infrastructure/
    │   │       ├── repos/
    │   │       │   ├── department_repository.py
    │   │       │   │   # implements IDepartmentRepository
    │   │       │   │   - AsyncSession db
    │   │       │   │   + __init__(db: AsyncSession)
    │   │       │   │   + get_all() -> list[Department]
    │   │       │   │   + get_by_id(id: int) -> Department
    │   │       │   │   + create(name: str) -> Department
    │   │       │   │   + update(id: int, name: str) -> Department
    │   │       │   │   + delete(id: int) -> None
    │   │       │   │   + has_users(id: int) -> bool
    │   │       │   │
    │   │       │   └── user_repository.py
    │   │       │       # implements IUserRepository + IUserReader (shared)
    │   │       │       - AsyncSession db
    │   │       │       + __init__(db: AsyncSession)
    │   │       │       + get_all_paginated(page, page_size) -> PaginatedResult[User]
    │   │       │       + get_by_id(id: int) -> User
    │   │       │       + get_by_email(email: str) -> User | None
    │   │       │       + create(data: CreateUserDTO) -> User
    │   │       │       + update(id: int, data: UpdateUserDTO) -> User
    │   │       │       + set_active(id: int, is_active: bool) -> None
    │   │       │       + get_name_by_id(id: int) -> str              # IUserReader (shared)
    │   │       │
    │   │       └── http/
    │   │           ├── router.py                       # APIRouter prefix="/admin"
    │   │           │   # All use cases wired via composition/dependencies.py
    │   │           │   # All endpoints require Depends(get_current_user) — role: Administrator
    │   │           │   # Router maps domain entities to response DTOs before returning
    │   │           │   + GET    /departments                -> list_departments_use_case.execute()
    │   │           │   + GET    /departments/{id}           -> get_department_use_case.execute(id)
    │   │           │   + POST   /departments                -> create_department_use_case.execute(name)
    │   │           │   + PUT    /departments/{id}           -> update_department_use_case.execute(id, name)
    │   │           │   + DELETE /departments/{id}           -> delete_department_use_case.execute(id)
    │   │           │   + GET    /users                      -> list_users_use_case.execute(page, page_size)
    │   │           │   + GET    /users/{id}                 -> get_user_use_case.execute(id)
    │   │           │   + POST   /users                      -> create_user_use_case.execute(data)
    │   │           │   + PUT    /users/{id}                 -> update_user_use_case.execute(id, data)
    │   │           │   + PATCH  /users/{id}/active          -> set_user_active_use_case.execute(id, is_active)
    │   │           │
    │   │           └── schemas.py
    │   │               DepartmentDTO
    │   │               + int id | str name
    │   │               CreateDepartmentDTO
    │   │               + str name                             # Required, unique, max 100 chars
    │   │               UpdateDepartmentDTO
    │   │               + str name
    │   │               UserDTO
    │   │               + int id | str first_name | str last_name | str email
    │   │               + str role | str department_name | bool is_active
    │   │               CreateUserDTO
    │   │               + str first_name                       # Required, max 100 chars
    │   │               + str last_name                        # Required, max 150 chars
    │   │               + str email                            # Required, unique, Google email
    │   │               + str role                             # "Administrator" | "Manager" | "Employee"
    │   │               + int department_id                    # Must exist in system
    │   │               + bool is_active = True
    │   │               UpdateUserDTO
    │   │               + str | None first_name
    │   │               + str | None last_name
    │   │               + str | None role
    │   │               + int | None department_id
    │
    │
    │   ├── suppliers/                                  # HU-05, HU-06 — Suppliers and Supplier-Product relations
    │   │   │
    │   │   ├── domain/
    │   │   │   ├── entities/
    │   │   │   │   ├── supplier.py
    │   │   │   │   │   - int id
    │   │   │   │   │   - str name
    │   │   │   │   │   - str tax_id                            # CIF
    │   │   │   │   │   - str address
    │   │   │   │   │   - str city
    │   │   │   │   │   - str province
    │   │   │   │   │   - str postal_code
    │   │   │   │   │   - str phone
    │   │   │   │   │   - str email
    │   │   │   │   │   - bool is_active
    │   │   │   │   │   - datetime created_at
    │   │   │   │   │   - datetime updated_at
    │   │   │   │   │   + __init__(...)
    │   │   │   │   │
    │   │   │   │   └── supplier_product.py
    │   │   │   │       - int supplier_id
    │   │   │   │       - int product_id
    │   │   │   │       - Decimal supplier_price
    │   │   │   │       + __init__(supplier_id, product_id, supplier_price)
    │   │   │   │
    │   │   │   └── interfaces/
    │   │   │       ├── repositories/
    │   │   │       │   └── i_supplier_repository.py
    │   │   │       │       + get_all_paginated(page, page_size) -> PaginatedResult[Supplier]
    │   │   │       │       + get_by_id(id: int) -> Supplier
    │   │   │       │       + get_by_tax_id(tax_id: str) -> Supplier | None
    │   │   │       │       + create(data: CreateSupplierDTO) -> Supplier
    │   │   │       │       + update(id: int, data: UpdateSupplierDTO) -> Supplier
    │   │   │       │       + set_active(id: int, is_active: bool) -> None
    │   │   │       │       + bulk_create(data: list[CreateSupplierDTO]) -> BulkResultDTO
    │   │   │       │       + get_products_by_supplier(id: int) -> list[SupplierProduct]
    │   │   │       │       + add_product(supplier_id: int, product_id: int, price: Decimal) -> SupplierProduct
    │   │   │       │       + remove_product(supplier_id: int, product_id: int) -> None
    │   │   │       │
    │   │   │       └── use_cases/                      # Flat — single entity group
    │   │   │           ├── i_list_suppliers_use_case.py
    │   │   │           │   + execute(page: int, page_size: int) -> PaginatedResult[Supplier]
    │   │   │           ├── i_get_supplier_use_case.py
    │   │   │           │   + execute(id: int) -> Supplier
    │   │   │           ├── i_create_supplier_use_case.py
    │   │   │           │   + execute(data: CreateSupplierDTO) -> Supplier
    │   │   │           ├── i_update_supplier_use_case.py
    │   │   │           │   + execute(id: int, data: UpdateSupplierDTO) -> Supplier
    │   │   │           ├── i_set_supplier_active_use_case.py
    │   │   │           │   + execute(id: int, is_active: bool) -> None
    │   │   │           ├── i_import_suppliers_use_case.py
    │   │   │           │   + execute(file: bytes) -> BulkResultDTO
    │   │   │           ├── i_download_supplier_template_use_case.py
    │   │   │           │   + execute() -> bytes
    │   │   │           ├── i_add_product_to_supplier_use_case.py
    │   │   │           │   + execute(supplier_id: int, product_id: int, price: Decimal) -> SupplierProduct
    │   │   │           └── i_remove_product_from_supplier_use_case.py
    │   │   │               + execute(supplier_id: int, product_id: int) -> None
    │   │   │
    │   │   ├── application/
    │   │   │   ├── list_suppliers_use_case.py
    │   │   │   │   - ISupplierRepository supplier_repository
    │   │   │   │   + execute(page, page_size) -> PaginatedResult[Supplier]
    │   │   │   ├── get_supplier_use_case.py
    │   │   │   │   - ISupplierRepository supplier_repository
    │   │   │   │   + execute(id: int) -> Supplier
    │   │   │   │     # Includes list of associated products with supplier_price
    │   │   │   ├── create_supplier_use_case.py
    │   │   │   │   - ISupplierRepository supplier_repository
    │   │   │   │   + execute(data: CreateSupplierDTO) -> Supplier
    │   │   │   │     # Validates unique tax_id and Spanish CIF format
    │   │   │   ├── update_supplier_use_case.py
    │   │   │   │   - ISupplierRepository supplier_repository
    │   │   │   │   + execute(id: int, data: UpdateSupplierDTO) -> Supplier
    │   │   │   ├── set_supplier_active_use_case.py
    │   │   │   │   - ISupplierRepository supplier_repository
    │   │   │   │   + execute(id: int, is_active: bool) -> None
    │   │   │   ├── import_suppliers_use_case.py
    │   │   │   │   - ISupplierRepository supplier_repository
    │   │   │   │   + execute(file: bytes) -> BulkResultDTO
    │   │   │   │     # Validates entire file before importing (all-or-nothing)
    │   │   │   │     # Returns summary: valid, errors, row-level detail
    │   │   │   ├── download_supplier_template_use_case.py
    │   │   │   │   + execute() -> bytes
    │   │   │   │     # Generates and returns .xlsx with openpyxl (headers + example row)
    │   │   │   ├── add_product_to_supplier_use_case.py
    │   │   │   │   - ISupplierRepository supplier_repository
    │   │   │   │   + execute(supplier_id: int, product_id: int, price: Decimal) -> SupplierProduct
    │   │   │   └── remove_product_from_supplier_use_case.py
    │   │   │       - ISupplierRepository supplier_repository
    │   │   │       + execute(supplier_id: int, product_id: int) -> None
    │   │   │
    │   │   └── infrastructure/
    │   │       ├── repos/
    │   │       │   └── supplier_repository.py
    │   │       │       # implements ISupplierRepository + ISupplierReader (shared)
    │   │       │       - AsyncSession db
    │   │       │       + __init__(db: AsyncSession)
    │   │       │       + get_all_paginated(page, page_size) -> PaginatedResult[Supplier]
    │   │       │       + get_by_id(id: int) -> Supplier
    │   │       │       + get_by_tax_id(tax_id: str) -> Supplier | None
    │   │       │       + create(data: CreateSupplierDTO) -> Supplier
    │   │       │       + update(id: int, data: UpdateSupplierDTO) -> Supplier
    │   │       │       + set_active(id: int, is_active: bool) -> None
    │   │       │       + bulk_create(data: list[CreateSupplierDTO]) -> BulkResultDTO
    │   │       │       + get_products_by_supplier(id: int) -> list[SupplierProduct]
    │   │       │       + add_product(supplier_id, product_id, price) -> SupplierProduct
    │   │       │       + remove_product(supplier_id, product_id) -> None
    │   │       │       + get_name_by_id(id: int) -> str              # ISupplierReader (shared)
    │   │       │
    │   │       └── http/
    │   │           ├── router.py                       # APIRouter prefix="/suppliers"
    │   │           │   # All use cases wired via composition/dependencies.py
    │   │           │   # Router maps domain entities to response DTOs before returning
    │   │           │   + GET    /                              -> list_suppliers_use_case.execute()
    │   │           │   + GET    /{id}                         -> get_supplier_use_case.execute(id)
    │   │           │   + POST   /                             -> create_supplier_use_case.execute(data)
    │   │           │   + PUT    /{id}                         -> update_supplier_use_case.execute(id, data)
    │   │           │   + PATCH  /{id}/active                  -> set_supplier_active_use_case.execute(id, is_active)
    │   │           │   + POST   /import                       -> import_suppliers_use_case.execute(file)
    │   │           │   #   Receives UploadFile, processes with openpyxl, all-or-nothing
    │   │           │   + GET    /template                     -> download_supplier_template_use_case.execute()
    │   │           │   + POST   /{id}/products                -> add_product_to_supplier_use_case.execute(...)
    │   │           │   + DELETE /{id}/products/{product_id}   -> remove_product_from_supplier_use_case.execute(...)
    │   │           │
    │   │           └── schemas.py
    │   │               SupplierDTO
    │   │               + int id | str name | str tax_id | str city | bool is_active
    │   │               SupplierDetailDTO(SupplierDTO)
    │   │               + str address | str province | str postal_code | str phone | str email
    │   │               + list[SupplierProductDTO] products
    │   │               CreateSupplierDTO
    │   │               + str name | str tax_id | str address | str city
    │   │               + str province | str postal_code | str phone | str email
    │   │               UpdateSupplierDTO
    │   │               + str | None name | str | None address | str | None city
    │   │               + str | None province | str | None postal_code | str | None phone | str | None email
    │   │               SupplierProductDTO
    │   │               + int product_id | str product_name | Decimal supplier_price
    │   │               BulkResultDTO
    │   │               + int total | int created | int errors
    │   │               + list[BulkErrorDTO] error_detail
    │   │               BulkErrorDTO
    │   │               + int row | str reason
    │
    │
    │   ├── clients/                                    # HU-07 — Clients
    │   │   │
    │   │   ├── domain/
    │   │   │   ├── entities/
    │   │   │   │   └── client.py
    │   │   │   │       - int id
    │   │   │   │       - str name
    │   │   │   │       - str tax_id                            # NIF
    │   │   │   │       - str address
    │   │   │   │       - str city
    │   │   │   │       - str province
    │   │   │   │       - str postal_code
    │   │   │   │       - str phone
    │   │   │   │       - str email
    │   │   │   │       - bool is_active
    │   │   │   │       - datetime created_at
    │   │   │   │       - datetime updated_at
    │   │   │   │       + __init__(...)
    │   │   │   │
    │   │   │   └── interfaces/
    │   │   │       ├── repositories/
    │   │   │       │   └── i_client_repository.py
    │   │   │       │       + get_all_paginated(page, page_size) -> PaginatedResult[Client]
    │   │   │       │       + get_by_id(id: int) -> Client
    │   │   │       │       + get_by_tax_id(tax_id: str) -> Client | None
    │   │   │       │       + create(data: CreateClientDTO) -> Client
    │   │   │       │       + update(id: int, data: UpdateClientDTO) -> Client
    │   │   │       │       + set_active(id: int, is_active: bool) -> None
    │   │   │       │
    │   │   │       └── use_cases/                      # Flat — single entity group
    │   │   │           ├── i_list_clients_use_case.py
    │   │   │           │   + execute(page: int, page_size: int) -> PaginatedResult[Client]
    │   │   │           ├── i_get_client_use_case.py
    │   │   │           │   + execute(id: int) -> Client
    │   │   │           ├── i_create_client_use_case.py
    │   │   │           │   + execute(data: CreateClientDTO) -> Client
    │   │   │           ├── i_update_client_use_case.py
    │   │   │           │   + execute(id: int, data: UpdateClientDTO) -> Client
    │   │   │           └── i_set_client_active_use_case.py
    │   │   │               + execute(id: int, is_active: bool) -> None
    │   │   │
    │   │   ├── application/
    │   │   │   ├── list_clients_use_case.py
    │   │   │   │   - IClientRepository client_repository
    │   │   │   │   + execute(page, page_size) -> PaginatedResult[Client]
    │   │   │   ├── get_client_use_case.py
    │   │   │   │   - IClientRepository client_repository
    │   │   │   │   + execute(id: int) -> Client
    │   │   │   ├── create_client_use_case.py
    │   │   │   │   - IClientRepository client_repository
    │   │   │   │   + execute(data: CreateClientDTO) -> Client
    │   │   │   │     # Validates unique tax_id and Spanish NIF/CIF format
    │   │   │   ├── update_client_use_case.py
    │   │   │   │   - IClientRepository client_repository
    │   │   │   │   + execute(id: int, data: UpdateClientDTO) -> Client
    │   │   │   └── set_client_active_use_case.py
    │   │   │       - IClientRepository client_repository
    │   │   │       + execute(id: int, is_active: bool) -> None
    │   │   │
    │   │   └── infrastructure/
    │   │       ├── repos/
    │   │       │   └── client_repository.py
    │   │       │       # implements IClientRepository + IClientReader (shared)
    │   │       │       - AsyncSession db
    │   │       │       + __init__(db: AsyncSession)
    │   │       │       + get_all_paginated(page, page_size) -> PaginatedResult[Client]
    │   │       │       + get_by_id(id: int) -> Client
    │   │       │       + get_by_tax_id(tax_id: str) -> Client | None
    │   │       │       + create(data: CreateClientDTO) -> Client
    │   │       │       + update(id: int, data: UpdateClientDTO) -> Client
    │   │       │       + set_active(id: int, is_active: bool) -> None
    │   │       │       + get_name_by_id(id: int) -> str              # IClientReader (shared)
    │   │       │
    │   │       └── http/
    │   │           ├── router.py                       # APIRouter prefix="/clients"
    │   │           │   # All use cases wired via composition/dependencies.py
    │   │           │   # Router maps domain entities to response DTOs before returning
    │   │           │   + GET    /           -> list_clients_use_case.execute(page, page_size)
    │   │           │   + GET    /{id}       -> get_client_use_case.execute(id)
    │   │           │   + POST   /           -> create_client_use_case.execute(data)
    │   │           │   + PUT    /{id}       -> update_client_use_case.execute(id, data)
    │   │           │   + PATCH  /{id}/active -> set_client_active_use_case.execute(id, is_active)
    │   │           │
    │   │           └── schemas.py
    │   │               ClientDTO
    │   │               + int id | str name | str tax_id | str city | bool is_active
    │   │               ClientDetailDTO(ClientDTO)
    │   │               + str address | str province | str postal_code | str phone | str email
    │   │               CreateClientDTO
    │   │               + str name | str tax_id | str address | str city
    │   │               + str province | str postal_code | str phone | str email
    │   │               UpdateClientDTO
    │   │               + str | None name | str | None address | str | None city
    │   │               + str | None province | str | None postal_code | str | None phone | str | None email
    │
    │
    │   ├── catalog/                                    # HU-08~HU-11 — Categories, Products, Stock info
    │   │   │
    │   │   ├── domain/
    │   │   │   ├── entities/
    │   │   │   │   ├── category.py
    │   │   │   │   │   - int id
    │   │   │   │   │   - str name
    │   │   │   │   │   - str description
    │   │   │   │   │   + __init__(id, name, description)
    │   │   │   │   │
    │   │   │   │   └── product.py
    │   │   │   │       - int id
    │   │   │   │       - str product_code
    │   │   │   │       - str name
    │   │   │   │       - str description
    │   │   │   │       - int category_id
    │   │   │   │       - Decimal price
    │   │   │   │       - int min_stock                         # Alert threshold; real stock in WarehouseStock
    │   │   │   │       - bool is_active
    │   │   │   │       - datetime created_at
    │   │   │   │       - datetime updated_at
    │   │   │   │       + __init__(...)
    │   │   │   │
    │   │   │   └── interfaces/
    │   │   │       ├── repositories/
    │   │   │       │   ├── i_category_repository.py
    │   │   │       │   │   + get_all() -> list[Category]
    │   │   │       │   │   + get_by_id(id: int) -> Category
    │   │   │       │   │   + get_name_by_id(id: int) -> str
    │   │   │       │   │   + create(data: CreateCategoryDTO) -> Category
    │   │   │       │   │   + update(id: int, data: UpdateCategoryDTO) -> Category
    │   │   │       │   │   + delete(id: int) -> None               # Only if no products linked
    │   │   │       │   │
    │   │   │       │   └── i_product_repository.py
    │   │   │       │       + get_all_paginated(page, page_size, is_active) -> PaginatedResult[Product]
    │   │   │       │       + get_by_id(id: int) -> Product
    │   │   │       │       + get_by_code(code: str) -> Product | None
    │   │   │       │       + get_name_by_id(id: int) -> str
    │   │   │       │       + get_min_stock(id: int) -> int
    │   │   │       │       + create(data: CreateProductDTO) -> Product
    │   │   │       │       + update(id: int, data: UpdateProductDTO) -> Product
    │   │   │       │       + set_active(id: int, is_active: bool) -> None
    │   │   │       │       # Stock lives in WarehouseStock — no update_stock here
    │   │   │       │
    │   │   │       └── use_cases/
    │   │   │           ├── categories/
    │   │   │           │   ├── i_list_categories_use_case.py
    │   │   │           │   │   + execute() -> list[Category]
    │   │   │           │   ├── i_create_category_use_case.py
    │   │   │           │   │   + execute(data: CreateCategoryDTO) -> Category
    │   │   │           │   ├── i_update_category_use_case.py
    │   │   │           │   │   + execute(id: int, data: UpdateCategoryDTO) -> Category
    │   │   │           │   └── i_delete_category_use_case.py
    │   │   │           │       + execute(id: int) -> None
    │   │   │           │
    │   │   │           └── products/
    │   │   │               ├── i_list_products_use_case.py
    │   │   │               │   + execute(page, page_size, is_active) -> PaginatedResult[Product]
    │   │   │               ├── i_get_product_use_case.py
    │   │   │               │   + execute(id: int) -> Product
    │   │   │               ├── i_create_product_use_case.py
    │   │   │               │   + execute(data: CreateProductDTO) -> Product
    │   │   │               ├── i_update_product_use_case.py
    │   │   │               │   + execute(id: int, data: UpdateProductDTO) -> Product
    │   │   │               ├── i_set_product_active_use_case.py
    │   │   │               │   + execute(id: int, is_active: bool) -> None
    │   │   │               └── i_get_stock_info_use_case.py
    │   │   │                   + execute(id: int) -> StockInfo
    │   │   │
    │   │   ├── application/
    │   │   │   ├── categories/
    │   │   │   │   ├── list_categories_use_case.py
    │   │   │   │   │   - ICategoryRepository category_repository
    │   │   │   │   │   + execute() -> list[Category]
    │   │   │   │   ├── create_category_use_case.py
    │   │   │   │   │   - ICategoryRepository category_repository
    │   │   │   │   │   + execute(data: CreateCategoryDTO) -> Category
    │   │   │   │   ├── update_category_use_case.py
    │   │   │   │   │   - ICategoryRepository category_repository
    │   │   │   │   │   + execute(id: int, data: UpdateCategoryDTO) -> Category
    │   │   │   │   └── delete_category_use_case.py
    │   │   │   │       - ICategoryRepository category_repository
    │   │   │   │       + execute(id: int) -> None
    │   │   │   │         # Raises error if category has linked products
    │   │   │   │
    │   │   │   └── products/
    │   │   │       ├── list_products_use_case.py
    │   │   │       │   - IProductRepository product_repository
    │   │   │       │   + execute(page, page_size, is_active) -> PaginatedResult[Product]
    │   │   │       ├── get_product_use_case.py
    │   │   │       │   - IProductRepository product_repository
    │   │   │       │   + execute(id: int) -> Product
    │   │   │       ├── create_product_use_case.py
    │   │   │       │   - IProductRepository product_repository
    │   │   │       │   - ICategoryRepository category_repository
    │   │   │       │   + execute(data: CreateProductDTO) -> Product
    │   │   │       │     # Validates unique product_code, existing category
    │   │   │       ├── update_product_use_case.py
    │   │   │       │   - IProductRepository product_repository
    │   │   │       │   - ICategoryRepository category_repository
    │   │   │       │   + execute(id: int, data: UpdateProductDTO) -> Product
    │   │   │       ├── set_product_active_use_case.py
    │   │   │       │   - IProductRepository product_repository
    │   │   │       │   + execute(id: int, is_active: bool) -> None
    │   │   │       └── get_stock_info_use_case.py
    │   │   │           - IProductRepository product_repository
    │   │   │           - IStockService stock_service                  # shared — no direct warehouse dep
    │   │   │           + execute(id: int) -> StockInfo
    │   │   │             # stock_current = stock_service.get_global_stock(id)
    │   │   │             # alert if stock_current < product.min_stock
    │   │   │
    │   │   └── infrastructure/
    │   │       ├── repos/
    │   │       │   ├── category_repository.py
    │   │       │   │   # implements ICategoryRepository
    │   │       │   │   - AsyncSession db
    │   │       │   │   + __init__(db: AsyncSession)
    │   │       │   │   + get_all() -> list[Category]
    │   │       │   │   + get_by_id(id: int) -> Category
    │   │       │   │   + get_name_by_id(id: int) -> str
    │   │       │   │   + create(data: CreateCategoryDTO) -> Category
    │   │       │   │   + update(id: int, data: UpdateCategoryDTO) -> Category
    │   │       │   │   + delete(id: int) -> None
    │   │       │   │
    │   │       │   └── product_repository.py
    │   │       │       # implements IProductRepository + IProductReader (shared)
    │   │       │       - AsyncSession db
    │   │       │       + __init__(db: AsyncSession)
    │   │       │       + get_all_paginated(page, page_size, is_active) -> PaginatedResult[Product]
    │   │       │       + get_by_id(id: int) -> Product
    │   │       │       + get_by_code(code: str) -> Product | None
    │   │       │       + get_name_by_id(id: int) -> str              # IProductReader (shared)
    │   │       │       + get_min_stock(id: int) -> int               # IProductReader (shared)
    │   │       │       + create(data: CreateProductDTO) -> Product
    │   │       │       + update(id: int, data: UpdateProductDTO) -> Product
    │   │       │       + set_active(id: int, is_active: bool) -> None
    │   │       │
    │   │       └── http/
    │   │           ├── router.py                       # APIRouter prefix="/catalog"
    │   │           │   # All use cases wired via composition/dependencies.py
    │   │           │   # Router maps domain entities to response DTOs before returning
    │   │           │   + GET    /categories                    -> list_categories_use_case.execute()
    │   │           │   + POST   /categories                    -> create_category_use_case.execute(data)
    │   │           │   + PUT    /categories/{id}               -> update_category_use_case.execute(id, data)
    │   │           │   + DELETE /categories/{id}               -> delete_category_use_case.execute(id)
    │   │           │   + GET    /products                      -> list_products_use_case.execute(page, page_size)
    │   │           │   + GET    /products/{id}                 -> get_product_use_case.execute(id)
    │   │           │   + POST   /products                      -> create_product_use_case.execute(data)
    │   │           │   + PUT    /products/{id}                 -> update_product_use_case.execute(id, data)
    │   │           │   + PATCH  /products/{id}/active          -> set_product_active_use_case.execute(id, is_active)
    │   │           │   + GET    /products/{id}/stock           -> get_stock_info_use_case.execute(id)
    │   │           │
    │   │           └── schemas.py
    │   │               CategoryDTO
    │   │               + int id | str name | str description
    │   │               CreateCategoryDTO
    │   │               + str name | str description
    │   │               UpdateCategoryDTO
    │   │               + str | None name | str | None description
    │   │               ProductDTO
    │   │               + int id | str product_code | str name
    │   │               + str category_name | Decimal price | bool is_active
    │   │               ProductDetailDTO(ProductDTO)
    │   │               + str description | int min_stock
    │   │               + int stock_current                      # Calculated: SUM(WarehouseStock) via IStockService
    │   │               + bool stock_alert                       # stock_current < min_stock
    │   │               CreateProductDTO
    │   │               + str product_code | str name | str description
    │   │               + int category_id | Decimal price | int min_stock
    │   │               UpdateProductDTO
    │   │               + str | None name | str | None description
    │   │               + int | None category_id | Decimal | None price | int | None min_stock
    │   │               StockInfoDTO
    │   │               + int stock_current                      # SUM(WarehouseStock.stock)
    │   │               + int min_stock | bool stock_alert
    │   │               + list[WarehouseStockDTO] breakdown      # Stock per warehouse (HU-11)
    │
    │
    │   ├── purchases/                                  # HU-14~HU-21 — Purchases and Purchase Lines
    │   │   │
    │   │   ├── domain/
    │   │   │   ├── entities/
    │   │   │   │   ├── purchase.py
    │   │   │   │   │   - int id
    │   │   │   │   │   - str purchase_number
    │   │   │   │   │   - int supplier_id
    │   │   │   │   │   - int user_id
    │   │   │   │   │   - int warehouse_id                       # FK to warehouses (delivery warehouse)
    │   │   │   │   │   - datetime purchase_date
    │   │   │   │   │   - str status                            # "Pending"|"Approved"|"In Process"|"Shipped"|"Received"|"Cancelled"
    │   │   │   │   │   - Decimal subtotal
    │   │   │   │   │   - Decimal taxes
    │   │   │   │   │   - Decimal total
    │   │   │   │   │   - datetime created_at
    │   │   │   │   │   - datetime updated_at
    │   │   │   │   │   + __init__(...)
    │   │   │   │   │
    │   │   │   │   └── purchase_line.py
    │   │   │   │       - int id
    │   │   │   │       - int purchase_id
    │   │   │   │       - int product_id
    │   │   │   │       - int quantity
    │   │   │   │       - Decimal unit_price
    │   │   │   │       - Decimal discount
    │   │   │   │       - Decimal line_subtotal
    │   │   │   │       + __init__(...)
    │   │   │   │
    │   │   │   └── interfaces/
    │   │   │       ├── repositories/
    │   │   │       │   └── i_purchase_repository.py
    │   │   │       │       + get_all_paginated(page, page_size, filters) -> PaginatedResult[Purchase]
    │   │   │       │       + get_by_id(id: int) -> Purchase
    │   │   │       │       + get_lines(purchase_id: int) -> list[PurchaseLine]
    │   │   │       │       + create(data: CreatePurchaseDTO) -> Purchase
    │   │   │       │       + update(id: int, data: UpdatePurchaseDTO) -> Purchase
    │   │   │       │       + change_status(id: int, new_status: str) -> Purchase
    │   │   │       │       + add_line(purchase_id: int, data: CreatePurchaseLineDTO) -> PurchaseLine
    │   │   │       │       + update_line(line_id: int, data: UpdatePurchaseLineDTO) -> PurchaseLine
    │   │   │       │       + delete_line(line_id: int) -> None
    │   │   │       │
    │   │   │       └── use_cases/
    │   │   │           ├── purchases/
    │   │   │           │   ├── i_list_purchases_use_case.py
    │   │   │           │   │   + execute(page, page_size, filters) -> PaginatedResult[Purchase]
    │   │   │           │   ├── i_get_purchase_use_case.py
    │   │   │           │   │   + execute(id: int) -> Purchase
    │   │   │           │   ├── i_create_purchase_use_case.py
    │   │   │           │   │   + execute(data: CreatePurchaseDTO) -> Purchase
    │   │   │           │   ├── i_update_purchase_use_case.py
    │   │   │           │   │   + execute(id: int, data: UpdatePurchaseDTO) -> Purchase
    │   │   │           │   ├── i_change_purchase_status_use_case.py
    │   │   │           │   │   + execute(id: int, new_status: str) -> Purchase
    │   │   │           │   └── i_cancel_purchase_use_case.py
    │   │   │           │       + execute(id: int) -> None
    │   │   │           │
    │   │   │           └── purchase_lines/
    │   │   │               ├── i_add_purchase_line_use_case.py
    │   │   │               │   + execute(purchase_id: int, data: CreatePurchaseLineDTO) -> PurchaseLine
    │   │   │               ├── i_update_purchase_line_use_case.py
    │   │   │               │   + execute(line_id: int, data: UpdatePurchaseLineDTO) -> PurchaseLine
    │   │   │               └── i_delete_purchase_line_use_case.py
    │   │   │                   + execute(line_id: int) -> None
    │   │   │
    │   │   ├── application/
    │   │   │   ├── purchases/
    │   │   │   │   ├── list_purchases_use_case.py
    │   │   │   │   │   - IPurchaseRepository purchase_repository
    │   │   │   │   │   + execute(page, page_size, filters) -> PaginatedResult[Purchase]
    │   │   │   │   ├── get_purchase_use_case.py
    │   │   │   │   │   - IPurchaseRepository purchase_repository
    │   │   │   │   │   - ISupplierReader supplier_reader              # shared — no direct supplier dep
    │   │   │   │   │   - IUserReader user_reader                      # shared — no direct admin dep
    │   │   │   │   │   - IWarehouseReader warehouse_reader            # shared — no direct warehouse dep
    │   │   │   │   │   + execute(id: int) -> Purchase
    │   │   │   │   │     # Header + lines + supplier name + user name + warehouse name
    │   │   │   │   ├── create_purchase_use_case.py
    │   │   │   │   │   - IPurchaseRepository purchase_repository
    │   │   │   │   │   - ISupplierReader supplier_reader              # shared
    │   │   │   │   │   - IWarehouseReader warehouse_reader            # shared
    │   │   │   │   │   + execute(data: CreatePurchaseDTO) -> Purchase
    │   │   │   │   │     # Generates purchase_number automatically, initial status "Pending"
    │   │   │   │   │     # Validates existing supplier and warehouse
    │   │   │   │   ├── update_purchase_use_case.py
    │   │   │   │   │   - IPurchaseRepository purchase_repository
    │   │   │   │   │   + execute(id: int, data: UpdatePurchaseDTO) -> Purchase
    │   │   │   │   │     # Only if status == "Pending"
    │   │   │   │   ├── change_purchase_status_use_case.py
    │   │   │   │   │   - IPurchaseRepository purchase_repository
    │   │   │   │   │   - IStockService stock_service                  # shared
    │   │   │   │   │   + execute(id: int, new_status: str) -> Purchase
    │   │   │   │   │     # Validates transitions: Pending→Approved→InProcess→Shipped→Received / →Cancelled
    │   │   │   │   │     # On "Received": stock_service.register_entry() per line
    │   │   │   │   └── cancel_purchase_use_case.py
    │   │   │   │       - IPurchaseRepository purchase_repository
    │   │   │   │       + execute(id: int) -> None
    │   │   │   │         # Only Pending or Approved. Releases reserved stock if applicable
    │   │   │   │
    │   │   │   └── purchase_lines/
    │   │   │       ├── add_purchase_line_use_case.py
    │   │   │       │   - IPurchaseRepository purchase_repository
    │   │   │       │   - IProductReader product_reader                # shared
    │   │   │       │   + execute(purchase_id: int, data: CreatePurchaseLineDTO) -> PurchaseLine
    │   │   │       │     # Only if purchase status is "Pending". Calculates line_subtotal
    │   │   │       │     # Validates existing product
    │   │   │       ├── update_purchase_line_use_case.py
    │   │   │       │   - IPurchaseRepository purchase_repository
    │   │   │       │   + execute(line_id: int, data: UpdatePurchaseLineDTO) -> PurchaseLine
    │   │   │       └── delete_purchase_line_use_case.py
    │   │   │           - IPurchaseRepository purchase_repository
    │   │   │           + execute(line_id: int) -> None
    │   │   │
    │   │   └── infrastructure/
    │   │       ├── repos/
    │   │       │   └── purchase_repository.py
    │   │       │       # implements IPurchaseRepository + IPurchaseReader (shared)
    │   │       │       - AsyncSession db
    │   │       │       + __init__(db: AsyncSession)
    │   │       │       + get_all_paginated(page, page_size, filters) -> PaginatedResult[Purchase]
    │   │       │       + get_by_id(id: int) -> Purchase
    │   │       │       + get_lines(purchase_id: int) -> list[PurchaseLine]
    │   │       │       + create(data: CreatePurchaseDTO) -> Purchase
    │   │       │       + update(id: int, data: UpdatePurchaseDTO) -> Purchase
    │   │       │       + change_status(id: int, new_status: str) -> Purchase
    │   │       │       + add_line(purchase_id, data) -> PurchaseLine
    │   │       │       + update_line(line_id, data) -> PurchaseLine
    │   │       │       + delete_line(line_id: int) -> None
    │   │       │       + get_latest(limit: int) -> list[Purchase]    # IPurchaseReader (shared)
    │   │       │       + get_by_status(status: str) -> list[Purchase] # IPurchaseReader (shared)
    │   │       │       + get_spend_by_month(year, month) -> Decimal   # IPurchaseReader (shared)
    │   │       │
    │   │       └── http/
    │   │           ├── router.py                       # APIRouter prefix="/purchases"
    │   │           │   # All use cases wired via composition/dependencies.py
    │   │           │   # Router maps domain entities to response DTOs before returning
    │   │           │   + GET    /                              -> list_purchases_use_case.execute()
    │   │           │   + GET    /{id}                         -> get_purchase_use_case.execute(id)
    │   │           │   + POST   /                             -> create_purchase_use_case.execute(data)
    │   │           │   + PUT    /{id}                         -> update_purchase_use_case.execute(id, data)
    │   │           │   + PATCH  /{id}/status                  -> change_purchase_status_use_case.execute(id, status)
    │   │           │   + PATCH  /{id}/cancel                  -> cancel_purchase_use_case.execute(id)
    │   │           │   + POST   /{id}/lines                   -> add_purchase_line_use_case.execute(id, data)
    │   │           │   + PUT    /{id}/lines/{line_id}         -> update_purchase_line_use_case.execute(line_id, data)
    │   │           │   + DELETE /{id}/lines/{line_id}         -> delete_purchase_line_use_case.execute(line_id)
    │   │           │
    │   │           └── schemas.py
    │   │               PurchaseDTO
    │   │               + int id | str purchase_number | str supplier_name
    │   │               + str warehouse_name | str status | datetime purchase_date | Decimal total
    │   │               PurchaseDetailDTO(PurchaseDTO)
    │   │               + str user_name | Decimal subtotal | Decimal taxes
    │   │               + list[PurchaseLineDTO] lines
    │   │               CreatePurchaseDTO
    │   │               + int supplier_id | int warehouse_id
    │   │               + list[CreatePurchaseLineDTO] lines
    │   │               UpdatePurchaseDTO
    │   │               + int | None supplier_id | int | None warehouse_id
    │   │               PurchaseLineDTO
    │   │               + int id | str product_name | int quantity
    │   │               + Decimal unit_price | Decimal discount | Decimal line_subtotal
    │   │               CreatePurchaseLineDTO
    │   │               + int product_id | int quantity
    │   │               + Decimal unit_price | Decimal discount = 0
    │   │               UpdatePurchaseLineDTO
    │   │               + int | None quantity | Decimal | None unit_price | Decimal | None discount
    │
    │
    │   ├── sales/                                      # HU-22~HU-28 — Sales and Sale Lines
    │   │   │                                           # (same pattern as purchases; Supplier→Client,
    │   │   │                                           #  statuses: Pending→Approved→InProcess→Shipped→Delivered/Cancelled)
    │   │   ├── domain/
    │   │   │   ├── entities/
    │   │   │   │   ├── sale.py
    │   │   │   │   │   - int id | str sale_number | int client_id | int user_id
    │   │   │   │   │   - datetime sale_date | str status | Decimal subtotal
    │   │   │   │   │   - Decimal taxes | Decimal total | str delivery_address
    │   │   │   │   │   - datetime created_at | datetime updated_at
    │   │   │   │   │   + __init__(...)
    │   │   │   │   │
    │   │   │   │   └── sale_line.py
    │   │   │   │       - int id | int sale_id | int product_id | int quantity
    │   │   │   │       - Decimal unit_price | Decimal discount | Decimal line_subtotal
    │   │   │   │       + __init__(...)
    │   │   │   │
    │   │   │   └── interfaces/
    │   │   │       ├── repositories/
    │   │   │       │   └── i_sale_repository.py        # Same methods as i_purchase_repository adapted for sales
    │   │   │       │       + get_all_paginated(page, page_size, filters) -> PaginatedResult[Sale]
    │   │   │       │       + get_by_id(id: int) -> Sale
    │   │   │       │       + get_lines(sale_id: int) -> list[SaleLine]
    │   │   │       │       + create(data: CreateSaleDTO) -> Sale
    │   │   │       │       + update(id: int, data: UpdateSaleDTO) -> Sale
    │   │   │       │       + change_status(id: int, new_status: str) -> Sale
    │   │   │       │       + add_line(sale_id: int, data: CreateSaleLineDTO) -> SaleLine
    │   │   │       │       + update_line(line_id: int, data: UpdateSaleLineDTO) -> SaleLine
    │   │   │       │       + delete_line(line_id: int) -> None
    │   │   │       │
    │   │   │       └── use_cases/
    │   │   │           ├── sales/
    │   │   │           │   ├── i_list_sales_use_case.py
    │   │   │           │   │   + execute(page, page_size, filters) -> PaginatedResult[Sale]
    │   │   │           │   ├── i_get_sale_use_case.py
    │   │   │           │   │   + execute(id: int) -> Sale
    │   │   │           │   ├── i_create_sale_use_case.py
    │   │   │           │   │   + execute(data: CreateSaleDTO) -> Sale
    │   │   │           │   ├── i_update_sale_use_case.py
    │   │   │           │   │   + execute(id: int, data: UpdateSaleDTO) -> Sale
    │   │   │           │   ├── i_change_sale_status_use_case.py
    │   │   │           │   │   + execute(id: int, new_status: str) -> Sale
    │   │   │           │   └── i_cancel_sale_use_case.py
    │   │   │           │       + execute(id: int) -> None
    │   │   │           │
    │   │   │           └── sale_lines/
    │   │   │               ├── i_add_sale_line_use_case.py
    │   │   │               │   + execute(sale_id: int, data: CreateSaleLineDTO) -> SaleLine
    │   │   │               ├── i_update_sale_line_use_case.py
    │   │   │               │   + execute(line_id: int, data: UpdateSaleLineDTO) -> SaleLine
    │   │   │               └── i_delete_sale_line_use_case.py
    │   │   │                   + execute(line_id: int) -> None
    │   │   │
    │   │   ├── application/
    │   │   │   ├── sales/
    │   │   │   │   ├── list_sales_use_case.py
    │   │   │   │   │   - ISaleRepository sale_repository
    │   │   │   │   │   + execute(page, page_size, filters) -> PaginatedResult[Sale]
    │   │   │   │   ├── get_sale_use_case.py
    │   │   │   │   │   - ISaleRepository sale_repository
    │   │   │   │   │   - IClientReader client_reader                  # shared — no direct client dep
    │   │   │   │   │   - IUserReader user_reader                      # shared — no direct admin dep
    │   │   │   │   │   + execute(id: int) -> Sale
    │   │   │   │   ├── create_sale_use_case.py
    │   │   │   │   │   - ISaleRepository sale_repository
    │   │   │   │   │   - IClientReader client_reader                  # shared
    │   │   │   │   │   - IStockService stock_service                  # shared
    │   │   │   │   │   + execute(data: CreateSaleDTO) -> Sale
    │   │   │   │   │     # Generates sale_number automatically, initial status "Pending"
    │   │   │   │   │     # Validates existing client and available stock
    │   │   │   │   ├── update_sale_use_case.py
    │   │   │   │   │   - ISaleRepository sale_repository
    │   │   │   │   │   + execute(id: int, data: UpdateSaleDTO) -> Sale
    │   │   │   │   │     # Only if status == "Pending"
    │   │   │   │   ├── change_sale_status_use_case.py
    │   │   │   │   │   - ISaleRepository sale_repository
    │   │   │   │   │   - IStockService stock_service                  # shared
    │   │   │   │   │   + execute(id: int, new_status: str) -> Sale
    │   │   │   │   │     # Transitions: Pending→Approved→InProcess→Shipped→Delivered / →Cancelled
    │   │   │   │   │     # On "Approved": stock_service.reserve_stock() per line
    │   │   │   │   │     # On "Delivered": stock_service.register_exit() + release_stock() per line
    │   │   │   │   └── cancel_sale_use_case.py
    │   │   │   │       - ISaleRepository sale_repository
    │   │   │   │       - IStockService stock_service                  # shared
    │   │   │   │       + execute(id: int) -> None
    │   │   │   │         # If status >= Approved: stock_service.release_stock() per line
    │   │   │   │
    │   │   │   └── sale_lines/
    │   │   │       ├── add_sale_line_use_case.py
    │   │   │       │   - ISaleRepository sale_repository
    │   │   │       │   - IProductReader product_reader                # shared
    │   │   │       │   - IStockService stock_service                  # shared
    │   │   │       │   + execute(sale_id: int, data: CreateSaleLineDTO) -> SaleLine
    │   │   │       │     # Validates available stock (stock - reserved) is sufficient
    │   │   │       ├── update_sale_line_use_case.py
    │   │   │       │   - ISaleRepository sale_repository
    │   │   │       │   + execute(line_id: int, data: UpdateSaleLineDTO) -> SaleLine
    │   │   │       └── delete_sale_line_use_case.py
    │   │   │           - ISaleRepository sale_repository
    │   │   │           + execute(line_id: int) -> None
    │   │   │
    │   │   └── infrastructure/
    │   │       ├── repos/
    │   │       │   └── sale_repository.py
    │   │       │       # implements ISaleRepository + ISaleReader (shared)
    │   │       │       - AsyncSession db
    │   │       │       + __init__(db: AsyncSession)
    │   │       │       + get_all_paginated(page, page_size, filters) -> PaginatedResult[Sale]
    │   │       │       + get_by_id(id: int) -> Sale
    │   │       │       + get_lines(sale_id: int) -> list[SaleLine]
    │   │       │       + create(data: CreateSaleDTO) -> Sale
    │   │       │       + update(id: int, data: UpdateSaleDTO) -> Sale
    │   │       │       + change_status(id: int, new_status: str) -> Sale
    │   │       │       + add_line(sale_id, data) -> SaleLine
    │   │       │       + update_line(line_id, data) -> SaleLine
    │   │       │       + delete_line(line_id: int) -> None
    │   │       │       + get_latest(limit: int) -> list[Sale]        # ISaleReader (shared)
    │   │       │       + get_by_status(status: str) -> list[Sale]    # ISaleReader (shared)
    │   │       │       + get_revenue_by_month(year, month) -> Decimal # ISaleReader (shared)
    │   │       │
    │   │       └── http/
    │   │           ├── router.py                       # APIRouter prefix="/sales"
    │   │           │   # All use cases wired via composition/dependencies.py
    │   │           │   # Router maps domain entities to response DTOs before returning
    │   │           │   + GET    /                              -> list_sales_use_case.execute()
    │   │           │   + GET    /{id}                         -> get_sale_use_case.execute(id)
    │   │           │   + POST   /                             -> create_sale_use_case.execute(data)
    │   │           │   + PUT    /{id}                         -> update_sale_use_case.execute(id, data)
    │   │           │   + PATCH  /{id}/status                  -> change_sale_status_use_case.execute(id, status)
    │   │           │   + PATCH  /{id}/cancel                  -> cancel_sale_use_case.execute(id)
    │   │           │   + POST   /{id}/lines                   -> add_sale_line_use_case.execute(id, data)
    │   │           │   + PUT    /{id}/lines/{line_id}         -> update_sale_line_use_case.execute(line_id, data)
    │   │           │   + DELETE /{id}/lines/{line_id}         -> delete_sale_line_use_case.execute(line_id)
    │   │           │
    │   │           └── schemas.py
    │   │               SaleDTO
    │   │               + int id | str sale_number | str client_name
    │   │               + str status | datetime sale_date | Decimal total
    │   │               SaleDetailDTO(SaleDTO)
    │   │               + str user_name | str delivery_address
    │   │               + Decimal subtotal | Decimal taxes
    │   │               + list[SaleLineDTO] lines
    │   │               CreateSaleDTO
    │   │               + int client_id | str delivery_address
    │   │               + list[CreateSaleLineDTO] lines
    │   │               UpdateSaleDTO
    │   │               + int | None client_id | str | None delivery_address
    │   │               SaleLineDTO
    │   │               + int id | str product_name | int quantity
    │   │               + Decimal unit_price | Decimal discount | Decimal line_subtotal
    │   │               CreateSaleLineDTO
    │   │               + int product_id | int quantity
    │   │               + Decimal unit_price | Decimal discount = 0
    │   │               UpdateSaleLineDTO
    │   │               + int | None quantity | Decimal | None unit_price | Decimal | None discount
    │
    │
    │   ├── warehouse/                                  # HU-12, HU-13, HU-30 — Warehouses, Stock, Movements
    │   │   │
    │   │   ├── domain/
    │   │   │   ├── entities/
    │   │   │   │   ├── warehouse.py
    │   │   │   │   │   - int id | str name | str address
    │   │   │   │   │   + __init__(id, name, address)
    │   │   │   │   │
    │   │   │   │   ├── warehouse_stock.py
    │   │   │   │   │   - int warehouse_id | int product_id | int stock
    │   │   │   │   │   - int reserved_stock                    # Units committed by Approved/InProcess/Shipped sales
    │   │   │   │   │   + __init__(warehouse_id, product_id, stock, reserved_stock=0)
    │   │   │   │   │   + available_stock -> int               # property: stock - reserved_stock
    │   │   │   │   │
    │   │   │   │   └── stock_movement.py
    │   │   │   │       - int id | int product_id
    │   │   │   │       - int | None purchase_id | int | None sale_id
    │   │   │   │       - str type                             # "Entry" | "Exit" | "Adjustment"
    │   │   │   │       - int quantity | datetime date | str reference
    │   │   │   │       + __init__(...)
    │   │   │   │
    │   │   │   └── interfaces/
    │   │   │       ├── repositories/
    │   │   │       │   └── i_warehouse_repository.py
    │   │   │       │       + get_all() -> list[Warehouse]
    │   │   │       │       + get_by_id(id: int) -> Warehouse
    │   │   │       │       + exists(id: int) -> bool
    │   │   │       │       + create(data: CreateWarehouseDTO) -> Warehouse
    │   │   │       │       + update(id: int, data: UpdateWarehouseDTO) -> Warehouse
    │   │   │       │       + get_stock_by_warehouse(warehouse_id: int) -> list[WarehouseStock]
    │   │   │       │       + get_global_stock(product_id: int) -> int
    │   │   │       │       + get_available_stock(product_id: int) -> int
    │   │   │       │       + update_stock(warehouse_id, product_id, stock) -> None
    │   │   │       │       + reserve_stock(product_id: int, quantity: int) -> None
    │   │   │       │       + release_stock(product_id: int, quantity: int) -> None
    │   │   │       │       + register_entry(product_id, warehouse_id, quantity, reference) -> None
    │   │   │       │       + register_exit(product_id, warehouse_id, quantity, reference) -> None
    │   │   │       │       + get_products_below_min_stock() -> list[ProductStockInfo]
    │   │   │       │       + get_movements_paginated(page, page_size, filters) -> PaginatedResult[StockMovement]
    │   │   │       │       + create_movement(data: CreateMovementDTO) -> StockMovement
    │   │   │       │
    │   │   │       └── use_cases/
    │   │   │           ├── warehouses/
    │   │   │           │   ├── i_list_warehouses_use_case.py
    │   │   │           │   │   + execute() -> list[Warehouse]
    │   │   │           │   ├── i_create_warehouse_use_case.py
    │   │   │           │   │   + execute(data: CreateWarehouseDTO) -> Warehouse
    │   │   │           │   └── i_update_warehouse_use_case.py
    │   │   │           │       + execute(id: int, data: UpdateWarehouseDTO) -> Warehouse
    │   │   │           │
    │   │   │           ├── stock/
    │   │   │           │   ├── i_get_warehouse_stock_use_case.py
    │   │   │           │   │   + execute(warehouse_id: int) -> list[WarehouseStock]
    │   │   │           │   ├── i_update_warehouse_stock_use_case.py
    │   │   │           │   │   + execute(warehouse_id, product_id, stock) -> None
    │   │   │           │   └── i_get_products_below_min_stock_use_case.py
    │   │   │           │       + execute() -> list[ProductStockInfo]
    │   │   │           │
    │   │   │           └── movements/
    │   │   │               ├── i_list_movements_use_case.py
    │   │   │               │   + execute(page, page_size, filters) -> PaginatedResult[StockMovement]
    │   │   │               └── i_register_movement_use_case.py
    │   │   │                   + execute(data: CreateMovementDTO) -> StockMovement
    │   │   │
    │   │   ├── application/
    │   │   │   ├── warehouses/
    │   │   │   │   ├── list_warehouses_use_case.py
    │   │   │   │   │   - IWarehouseRepository warehouse_repository
    │   │   │   │   │   + execute() -> list[Warehouse]
    │   │   │   │   ├── create_warehouse_use_case.py
    │   │   │   │   │   - IWarehouseRepository warehouse_repository
    │   │   │   │   │   + execute(data: CreateWarehouseDTO) -> Warehouse
    │   │   │   │   └── update_warehouse_use_case.py
    │   │   │   │       - IWarehouseRepository warehouse_repository
    │   │   │   │       + execute(id: int, data: UpdateWarehouseDTO) -> Warehouse
    │   │   │   │
    │   │   │   ├── stock/
    │   │   │   │   ├── get_warehouse_stock_use_case.py
    │   │   │   │   │   - IWarehouseRepository warehouse_repository
    │   │   │   │   │   - IProductReader product_reader                # shared — no direct catalog dep
    │   │   │   │   │   + execute(warehouse_id: int) -> list[WarehouseStock]
    │   │   │   │   │     # Enriches each entry with product name from IProductReader
    │   │   │   │   ├── update_warehouse_stock_use_case.py
    │   │   │   │   │   - IWarehouseRepository warehouse_repository
    │   │   │   │   │   + execute(warehouse_id, product_id, stock) -> None
    │   │   │   │   └── get_products_below_min_stock_use_case.py
    │   │   │   │       - IWarehouseRepository warehouse_repository
    │   │   │   │       + execute() -> list[ProductStockInfo]
    │   │   │   │         # JOIN WarehouseStock+Product WHERE SUM(stock) < min_stock
    │   │   │   │
    │   │   │   └── movements/
    │   │   │       ├── list_movements_use_case.py
    │   │   │       │   - IWarehouseRepository warehouse_repository
    │   │   │       │   + execute(page, page_size, filters) -> PaginatedResult[StockMovement]
    │   │   │       │     # Filters: product, type, date_from, date_to, reference
    │   │   │       └── register_movement_use_case.py
    │   │   │           - IWarehouseRepository warehouse_repository
    │   │   │           + execute(data: CreateMovementDTO) -> StockMovement
    │   │   │             # Called internally by purchases (Received→Entry) and sales (Delivered→Exit)
    │   │   │
    │   │   └── infrastructure/
    │   │       ├── repos/
    │   │       │   └── warehouse_repository.py
    │   │       │       # implements IWarehouseRepository + IStockService + IWarehouseReader (shared)
    │   │       │       - AsyncSession db
    │   │       │       + __init__(db: AsyncSession)
    │   │       │       + get_all() -> list[Warehouse]
    │   │       │       + get_by_id(id: int) -> Warehouse
    │   │       │       + exists(id: int) -> bool                      # IWarehouseReader (shared)
    │   │       │       + create(data: CreateWarehouseDTO) -> Warehouse
    │   │       │       + update(id: int, data: UpdateWarehouseDTO) -> Warehouse
    │   │       │       + get_stock_by_warehouse(warehouse_id) -> list[WarehouseStock]
    │   │       │       + get_global_stock(product_id: int) -> int     # IStockService (shared)
    │   │       │       + get_available_stock(product_id: int) -> int  # IStockService (shared)
    │   │       │       + update_stock(warehouse_id, product_id, stock) -> None
    │   │       │       + reserve_stock(product_id, quantity) -> None  # IStockService (shared)
    │   │       │       + release_stock(product_id, quantity) -> None  # IStockService (shared)
    │   │       │       + register_entry(product_id, warehouse_id, quantity, reference) -> None  # IStockService (shared)
    │   │       │       + register_exit(product_id, warehouse_id, quantity, reference) -> None   # IStockService (shared)
    │   │       │       + get_products_below_min_stock() -> list[ProductStockInfo]              # IStockService (shared)
    │   │       │       + get_movements_paginated(page, page_size, filters) -> PaginatedResult[StockMovement]
    │   │       │       + create_movement(data: CreateMovementDTO) -> StockMovement
    │   │       │
    │   │       └── http/
    │   │           ├── router.py                       # APIRouter prefix="/warehouse"
    │   │           │   # All use cases wired via composition/dependencies.py
    │   │           │   # Router maps domain entities to response DTOs before returning
    │   │           │   + GET    /warehouses                    -> list_warehouses_use_case.execute()
    │   │           │   + POST   /warehouses                    -> create_warehouse_use_case.execute(data)
    │   │           │   + PUT    /warehouses/{id}               -> update_warehouse_use_case.execute(id, data)
    │   │           │   + GET    /warehouses/{id}/stock         -> get_warehouse_stock_use_case.execute(id)
    │   │           │   + PATCH  /warehouses/{id}/stock         -> update_warehouse_stock_use_case.execute(id, ...)
    │   │           │   + GET    /movements                     -> list_movements_use_case.execute(page, page_size, filters)
    │   │           │
    │   │           └── schemas.py
    │   │               WarehouseDTO
    │   │               + int id | str name | str address
    │   │               CreateWarehouseDTO
    │   │               + str name | str address
    │   │               UpdateWarehouseDTO
    │   │               + str | None name | str | None address
    │   │               WarehouseStockDTO
    │   │               + str product_name | int stock | int reserved_stock | int available_stock
    │   │               MovementDTO
    │   │               + int id | str product_name | str type
    │   │               + int quantity | datetime date | str reference
    │   │               + str | None purchase_number | str | None sale_number
    │   │               ProductStockInfoDTO
    │   │               + int product_id | str product_name | int stock_current | int min_stock
    │
    │
    │   └── dashboard/                                  # HU-29 — Dashboard
    │       │                                           # No own repos or domain: aggregates data from other modules
    │       │                                           # via shared interfaces only — no direct module deps
    │       ├── domain/
    │       │   └── interfaces/
    │       │       └── use_cases/
    │       │           └── i_get_dashboard_use_case.py
    │       │               + execute(user_id: int, role: str) -> DashboardData
    │       │
    │       ├── application/
    │       │   └── get_dashboard_use_case.py
    │       │       - IPurchaseReader purchase_reader              # shared — no direct purchases dep
    │       │       - ISaleReader sale_reader                      # shared — no direct sales dep
    │       │       - IStockService stock_service                  # shared — no direct warehouse dep
    │       │       + execute(user_id: int, role: str) -> DashboardData
    │       │         # Aggregates: purchase/sale summary by status, latest 5-10 of each,
    │       │         # monthly spend current vs previous month,
    │       │         # products below min stock = stock_service.get_products_below_min_stock()
    │       │         # alerts: purchases/sales with no status change in N days
    │       │
    │       └── infrastructure/
    │           └── http/
    │               ├── router.py                       # APIRouter prefix="/dashboard"
    │               │   # Use cases wired via composition/dependencies.py
    │               │   + GET /  -> get_dashboard_use_case.execute(current_user.id, current_user.role)
    │               └── schemas.py
    │                   DashboardDTO
    │                   + list[StatusCountDTO] purchases_by_status
    │                   + list[StatusCountDTO] sales_by_status
    │                   + list[PurchaseDTO] latest_purchases
    │                   + list[SaleDTO] latest_sales
    │                   + MonthlySpendDTO monthly_spend
    │                   + list[ProductStockInfoDTO] products_below_min_stock
    │                   + list[AlertDTO] purchase_alerts
    │                   + list[AlertDTO] sale_alerts
    │                   StatusCountDTO
    │                   + str status | int count
    │                   MonthlySpendDTO
    │                   + Decimal current_month | Decimal previous_month
    │                   + Decimal difference | Decimal change_percentage
    │                   AlertDTO
    │                   + int id | str number | str status | int days_without_change
    │
    │
    └── composition/                                    # Composition Root — equivalent to DI / Program.cs
        ├── main.py                                     # FastAPI entry point: creates app, registers routers
        │   + app = FastAPI()                           # Swagger UI at /docs (automatic)
        │   │                                           # ReDoc at /redoc (automatic)
        │   │                                           # OpenAPI schema at /openapi.json
        │   │                                           # On startup: calls init_firebase_app() from firebase_client
        │   + GET /health
        │   + GET /ready
        │
        ├── router_registry.py                          # Registers all APIRouters from all modules
        │   + include_all_routers(app: FastAPI) -> None
        │     # app.include_router(auth_router,      prefix="/auth")
        │     # app.include_router(admin_router,     prefix="/admin")
        │     # app.include_router(suppliers_router, prefix="/suppliers")
        │     # app.include_router(clients_router,   prefix="/clients")
        │     # app.include_router(catalog_router,   prefix="/catalog")
        │     # app.include_router(purchases_router, prefix="/purchases")
        │     # app.include_router(sales_router,     prefix="/sales")
        │     # app.include_router(warehouse_router, prefix="/warehouse")
        │     # app.include_router(dashboard_router, prefix="/dashboard")
        │
        ├── security.py                                 # Authentication dependency — NOT a use-case factory
        │   + get_current_user(
        │       credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
        │       db: AsyncSession = Depends(get_db)
        │     ) -> UserSession
        │     # 1. Extracts Bearer token from Authorization header
        │     # 2. Calls firebase_auth_provider.verify_firebase_token(token) -> claims
        │     #    Raises HTTP 401 if token is invalid, expired, or revoked
        │     # 3. Queries DB for active user by firebase_uid from claims
        │     #    Raises HTTP 401 if user not found or not active
        │     # 4. Returns UserSession(email, role, department_id, firebase_uid)
        │     #    from shared/domain/entities/user_session.py
        │     # Used by all protected endpoints via Depends(get_current_user)
        │
        └── dependencies.py                             # Use-case factories only — DI wiring
            # Each function constructs the use case injecting its dependencies
            # Cross-module shared interfaces are injected using the concrete repo
            # that implements the shared interface (resolved here at composition root)
            #
            # ── auth ──
            + get_login_use_case(db: AsyncSession = Depends(get_db)) -> ILoginUseCase:
                return LoginUseCase(AuthRepository(db))
            + get_logout_use_case(db: AsyncSession = Depends(get_db)) -> ILogoutUseCase:
                return LogoutUseCase(AuthRepository(db))
            #
            # ── admin / departments ──
            + get_list_departments_use_case(db: AsyncSession = Depends(get_db)) -> IListDepartmentsUseCase:
                return ListDepartmentsUseCase(DepartmentRepository(db))
            + get_get_department_use_case(db: AsyncSession = Depends(get_db)) -> IGetDepartmentUseCase:
                return GetDepartmentUseCase(DepartmentRepository(db))
            + get_create_department_use_case(db: AsyncSession = Depends(get_db)) -> ICreateDepartmentUseCase:
                return CreateDepartmentUseCase(DepartmentRepository(db))
            + get_update_department_use_case(db: AsyncSession = Depends(get_db)) -> IUpdateDepartmentUseCase:
                return UpdateDepartmentUseCase(DepartmentRepository(db))
            + get_delete_department_use_case(db: AsyncSession = Depends(get_db)) -> IDeleteDepartmentUseCase:
                return DeleteDepartmentUseCase(DepartmentRepository(db))
            #
            # ── admin / users ──
            + get_list_users_use_case(db: AsyncSession = Depends(get_db)) -> IListUsersUseCase:
                return ListUsersUseCase(UserRepository(db))
            + get_get_user_use_case(db: AsyncSession = Depends(get_db)) -> IGetUserUseCase:
                return GetUserUseCase(UserRepository(db))
            + get_create_user_use_case(db: AsyncSession = Depends(get_db)) -> ICreateUserUseCase:
                return CreateUserUseCase(UserRepository(db), DepartmentRepository(db))
            + get_update_user_use_case(db: AsyncSession = Depends(get_db)) -> IUpdateUserUseCase:
                return UpdateUserUseCase(UserRepository(db), DepartmentRepository(db))
            + get_set_user_active_use_case(db: AsyncSession = Depends(get_db)) -> ISetUserActiveUseCase:
                return SetUserActiveUseCase(UserRepository(db))
            #
            # ── suppliers ──
            + get_list_suppliers_use_case(db: AsyncSession = Depends(get_db)) -> IListSuppliersUseCase:
                return ListSuppliersUseCase(SupplierRepository(db))
            + get_get_supplier_use_case(db: AsyncSession = Depends(get_db)) -> IGetSupplierUseCase:
                return GetSupplierUseCase(SupplierRepository(db))
            + get_create_supplier_use_case(db: AsyncSession = Depends(get_db)) -> ICreateSupplierUseCase:
                return CreateSupplierUseCase(SupplierRepository(db))
            + get_update_supplier_use_case(db: AsyncSession = Depends(get_db)) -> IUpdateSupplierUseCase:
                return UpdateSupplierUseCase(SupplierRepository(db))
            + get_set_supplier_active_use_case(db: AsyncSession = Depends(get_db)) -> ISetSupplierActiveUseCase:
                return SetSupplierActiveUseCase(SupplierRepository(db))
            + get_import_suppliers_use_case(db: AsyncSession = Depends(get_db)) -> IImportSuppliersUseCase:
                return ImportSuppliersUseCase(SupplierRepository(db))
            + get_download_supplier_template_use_case() -> IDownloadSupplierTemplateUseCase:
                return DownloadSupplierTemplateUseCase()
            + get_add_product_to_supplier_use_case(db: AsyncSession = Depends(get_db)) -> IAddProductToSupplierUseCase:
                return AddProductToSupplierUseCase(SupplierRepository(db))
            + get_remove_product_from_supplier_use_case(db: AsyncSession = Depends(get_db)) -> IRemoveProductFromSupplierUseCase:
                return RemoveProductFromSupplierUseCase(SupplierRepository(db))
            #
            # ── clients ──
            + get_list_clients_use_case(db: AsyncSession = Depends(get_db)) -> IListClientsUseCase:
                return ListClientsUseCase(ClientRepository(db))
            + get_get_client_use_case(db: AsyncSession = Depends(get_db)) -> IGetClientUseCase:
                return GetClientUseCase(ClientRepository(db))
            + get_create_client_use_case(db: AsyncSession = Depends(get_db)) -> ICreateClientUseCase:
                return CreateClientUseCase(ClientRepository(db))
            + get_update_client_use_case(db: AsyncSession = Depends(get_db)) -> IUpdateClientUseCase:
                return UpdateClientUseCase(ClientRepository(db))
            + get_set_client_active_use_case(db: AsyncSession = Depends(get_db)) -> ISetClientActiveUseCase:
                return SetClientActiveUseCase(ClientRepository(db))
            #
            # ── catalog / categories ──
            + get_list_categories_use_case(db: AsyncSession = Depends(get_db)) -> IListCategoriesUseCase:
                return ListCategoriesUseCase(CategoryRepository(db))
            + get_create_category_use_case(db: AsyncSession = Depends(get_db)) -> ICreateCategoryUseCase:
                return CreateCategoryUseCase(CategoryRepository(db))
            + get_update_category_use_case(db: AsyncSession = Depends(get_db)) -> IUpdateCategoryUseCase:
                return UpdateCategoryUseCase(CategoryRepository(db))
            + get_delete_category_use_case(db: AsyncSession = Depends(get_db)) -> IDeleteCategoryUseCase:
                return DeleteCategoryUseCase(CategoryRepository(db))
            #
            # ── catalog / products ──
            + get_list_products_use_case(db: AsyncSession = Depends(get_db)) -> IListProductsUseCase:
                return ListProductsUseCase(ProductRepository(db))
            + get_get_product_use_case(db: AsyncSession = Depends(get_db)) -> IGetProductUseCase:
                return GetProductUseCase(ProductRepository(db))
            + get_create_product_use_case(db: AsyncSession = Depends(get_db)) -> ICreateProductUseCase:
                return CreateProductUseCase(ProductRepository(db), CategoryRepository(db))
            + get_update_product_use_case(db: AsyncSession = Depends(get_db)) -> IUpdateProductUseCase:
                return UpdateProductUseCase(ProductRepository(db), CategoryRepository(db))
            + get_set_product_active_use_case(db: AsyncSession = Depends(get_db)) -> ISetProductActiveUseCase:
                return SetProductActiveUseCase(ProductRepository(db))
            + get_get_stock_info_use_case(db: AsyncSession = Depends(get_db)) -> IGetStockInfoUseCase:
                return GetStockInfoUseCase(
                    ProductRepository(db),    # IProductReader
                    WarehouseRepository(db),  # IStockService
                )
            #
            # ── warehouse / warehouses ──
            + get_list_warehouses_use_case(db: AsyncSession = Depends(get_db)) -> IListWarehousesUseCase:
                return ListWarehousesUseCase(WarehouseRepository(db))
            + get_create_warehouse_use_case(db: AsyncSession = Depends(get_db)) -> ICreateWarehouseUseCase:
                return CreateWarehouseUseCase(WarehouseRepository(db))
            + get_update_warehouse_use_case(db: AsyncSession = Depends(get_db)) -> IUpdateWarehouseUseCase:
                return UpdateWarehouseUseCase(WarehouseRepository(db))
            #
            # ── warehouse / stock ──
            + get_get_warehouse_stock_use_case(db: AsyncSession = Depends(get_db)) -> IGetWarehouseStockUseCase:
                return GetWarehouseStockUseCase(
                    WarehouseRepository(db),
                    ProductRepository(db),    # IProductReader
                )
            + get_update_warehouse_stock_use_case(db: AsyncSession = Depends(get_db)) -> IUpdateWarehouseStockUseCase:
                return UpdateWarehouseStockUseCase(WarehouseRepository(db))
            + get_products_below_min_stock_use_case(db: AsyncSession = Depends(get_db)) -> IGetProductsBelowMinStockUseCase:
                return GetProductsBelowMinStockUseCase(WarehouseRepository(db))
            #
            # ── warehouse / movements ──
            + get_list_movements_use_case(db: AsyncSession = Depends(get_db)) -> IListMovementsUseCase:
                return ListMovementsUseCase(WarehouseRepository(db))
            + get_register_movement_use_case(db: AsyncSession = Depends(get_db)) -> IRegisterMovementUseCase:
                return RegisterMovementUseCase(WarehouseRepository(db))
            #
            # ── purchases ──
            + get_list_purchases_use_case(db: AsyncSession = Depends(get_db)) -> IListPurchasesUseCase:
                return ListPurchasesUseCase(PurchaseRepository(db))
            + get_get_purchase_use_case(db: AsyncSession = Depends(get_db)) -> IGetPurchaseUseCase:
                return GetPurchaseUseCase(
                    PurchaseRepository(db),
                    SupplierRepository(db),   # ISupplierReader
                    UserRepository(db),       # IUserReader
                    WarehouseRepository(db),  # IWarehouseReader
                )
            + get_create_purchase_use_case(db: AsyncSession = Depends(get_db)) -> ICreatePurchaseUseCase:
                return CreatePurchaseUseCase(
                    PurchaseRepository(db),
                    SupplierRepository(db),   # ISupplierReader
                    WarehouseRepository(db),  # IWarehouseReader
                )
            + get_update_purchase_use_case(db: AsyncSession = Depends(get_db)) -> IUpdatePurchaseUseCase:
                return UpdatePurchaseUseCase(PurchaseRepository(db))
            + get_change_purchase_status_use_case(db: AsyncSession = Depends(get_db)) -> IChangePurchaseStatusUseCase:
                return ChangePurchaseStatusUseCase(
                    PurchaseRepository(db),
                    WarehouseRepository(db),  # IStockService
                )
            + get_cancel_purchase_use_case(db: AsyncSession = Depends(get_db)) -> ICancelPurchaseUseCase:
                return CancelPurchaseUseCase(PurchaseRepository(db))
            + get_add_purchase_line_use_case(db: AsyncSession = Depends(get_db)) -> IAddPurchaseLineUseCase:
                return AddPurchaseLineUseCase(
                    PurchaseRepository(db),
                    ProductRepository(db),    # IProductReader
                )
            + get_update_purchase_line_use_case(db: AsyncSession = Depends(get_db)) -> IUpdatePurchaseLineUseCase:
                return UpdatePurchaseLineUseCase(PurchaseRepository(db))
            + get_delete_purchase_line_use_case(db: AsyncSession = Depends(get_db)) -> IDeletePurchaseLineUseCase:
                return DeletePurchaseLineUseCase(PurchaseRepository(db))
            #
            # ── sales ──
            + get_list_sales_use_case(db: AsyncSession = Depends(get_db)) -> IListSalesUseCase:
                return ListSalesUseCase(SaleRepository(db))
            + get_get_sale_use_case(db: AsyncSession = Depends(get_db)) -> IGetSaleUseCase:
                return GetSaleUseCase(
                    SaleRepository(db),
                    ClientRepository(db),     # IClientReader
                    UserRepository(db),       # IUserReader
                )
            + get_create_sale_use_case(db: AsyncSession = Depends(get_db)) -> ICreateSaleUseCase:
                return CreateSaleUseCase(
                    SaleRepository(db),
                    ClientRepository(db),     # IClientReader
                    WarehouseRepository(db),  # IStockService
                )
            + get_update_sale_use_case(db: AsyncSession = Depends(get_db)) -> IUpdateSaleUseCase:
                return UpdateSaleUseCase(SaleRepository(db))
            + get_change_sale_status_use_case(db: AsyncSession = Depends(get_db)) -> IChangeSaleStatusUseCase:
                return ChangeSaleStatusUseCase(
                    SaleRepository(db),
                    WarehouseRepository(db),  # IStockService
                )
            + get_cancel_sale_use_case(db: AsyncSession = Depends(get_db)) -> ICancelSaleUseCase:
                return CancelSaleUseCase(
                    SaleRepository(db),
                    WarehouseRepository(db),  # IStockService
                )
            + get_add_sale_line_use_case(db: AsyncSession = Depends(get_db)) -> IAddSaleLineUseCase:
                return AddSaleLineUseCase(
                    SaleRepository(db),
                    ProductRepository(db),    # IProductReader
                    WarehouseRepository(db),  # IStockService
                )
            + get_update_sale_line_use_case(db: AsyncSession = Depends(get_db)) -> IUpdateSaleLineUseCase:
                return UpdateSaleLineUseCase(SaleRepository(db))
            + get_delete_sale_line_use_case(db: AsyncSession = Depends(get_db)) -> IDeleteSaleLineUseCase:
                return DeleteSaleLineUseCase(SaleRepository(db))
            #
            # ── dashboard ──
            + get_get_dashboard_use_case(db: AsyncSession = Depends(get_db)) -> IGetDashboardUseCase:
                return GetDashboardUseCase(
                    PurchaseRepository(db),   # IPurchaseReader
                    SaleRepository(db),       # ISaleReader
                    WarehouseRepository(db),  # IStockService
                )
