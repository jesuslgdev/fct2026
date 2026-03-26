# FCT2026 ERP — Backend Structure

> Last updated: 2026-03-05
> Reflects the real implementation across branches up to `feature/backend_department_DTOs` and `feature/backend_auth_logout`.

---

## Directory tree

```
backend/
├── main.py                                      # FastAPI app, lifespan, CORS, health/ready endpoints
├── alembic.ini
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
│
├── alembic/
│   ├── env.py                                   # Async setup; SelectorEventLoop on Windows
│   ├── README
│   ├── script.py.mako
│   └── versions/
│       ├── f4069b602566_init.py                 # Empty baseline migration
│       └── 890e4ffe7ec7_create_usuarios_table.py # Creates "users" table
│
├── composition/
│   ├── __init__.py
│   ├── dependencies.py                          # FastAPI dependencies (individual per use case)
│   └── router_registry.py                      # Registers all module routers under /api/v1
│
├── shared/
│   ├── __init__.py
│   ├── config.py                                # Settings (pydantic-settings); singleton `settings`
│   ├── domain/
│   │   ├── __init__.py
│   │   └── entities/
│   │       ├── __init__.py
│   │       └── user.py                          # ORM User model (table: "users")
│   └── infrastructure/
│       ├── __init__.py
│       ├── database/
│       │   ├── __init__.py
│       │   ├── base_model.py                    # DeclarativeBase with naming conventions
│       │   ├── connection.py                    # AsyncEngine, AsyncSessionLocal, get_db()
│       │   └── seed.py                          # Seeds superadmin user on startup
│       └── security/
│           ├── __init__.py
│           ├── firebase_client.py               # init_firebase_app()
│           └── firebase_auth_provider.py        # verify_firebase_token(), revoke_firebase_tokens()
│
├── modules/
│   ├── __init__.py
│   │
│   ├── auth/                                    # [IMPLEMENTED]
│   │   ├── __init__.py
│   │   ├── application/
│   │   │   ├── __init__.py
│   │   │   ├── login_use_case.py                # Verifies Firebase token, looks up user in DB
│   │   │   └── logout_use_case.py               # Calls revoke_firebase_tokens()
│   │   ├── domain/
│   │   │   ├── __init__.py
│   │   │   ├── entities/
│   │   │   │   ├── __init__.py
│   │   │   │   └── user_session.py              # @dataclass UserSession
│   │   │   └── interfaces/
│   │   │       ├── __init__.py
│   │   │       ├── i_auth_repository.py
│   │   │       ├── i_login_use_case.py
│   │   │       └── i_logout_use_case.py
│   │   └── infrastructure/
│   │       ├── __init__.py
│   │       ├── http/
│   │       │   ├── __init__.py
│   │       │   ├── router.py                    # prefix="/auth" → /api/v1/auth
│   │       │   └── schemas/
│   │       │       ├── __init__.py
│   │       │       ├── login_request.py         # LoginRequestDTO(firebase_id_token)
│   │       │       └── login_response.py        # LoginResponseDTO(role, department_id, name)
│   │       └── repos/
│   │           ├── __init__.py
│   │           └── auth_repository.py           # find_active_user_by_email()
│   │
│   ├── admin/                                   # [IMPLEMENTED — departments only]
│   │   ├── __init__.py
│   │   ├── application/
│   │   │   ├── __init__.py
│   │   │   ├── list_departments_use_case.py
│   │   │   ├── create_department_use_case.py
│   │   │   ├── update_department_use_case.py
│   │   │   ├── delete_department_use_case.py
│   │   │   └── get_department_use_case.py
│   │   ├── domain/
│   │   │   ├── __init__.py
│   │   │   ├── entities/
│   │   │   │   ├── __init__.py
│   │   │   │   └── department.py                # ORM Department model (table: "departments")
│   │   │   └── interfaces/
│   │   │       ├── __init__.py
│   │   │       ├── i_department_repository.py
│   │   │       ├── i_list_departments_use_case.py
│   │   │       ├── i_create_department_use_case.py
│   │   │       ├── i_update_department_use_case.py
│   │   │       ├── i_delete_department_use_case.py
│   │   │       └── i_get_department_use_case.py
│   │   └── infrastructure/
│   │       ├── __init__.py
│   │       ├── http/
│   │       │   ├── __init__.py
│   │       │   ├── router.py                    # prefix="/admin" → /api/v1/admin
│   │       │   └── schemas.py                   # DepartmentDTO, CreateDepartmentDTO, UpdateDepartmentDTO
│   │       └── repos/
│   │           ├── __init__.py
│   │           └── department_repository.py     # get_all, get_by_id, create, update, delete, has_users
│   │
│   ├── suppliers/      # [PENDING]
│   ├── clients/        # [PENDING]
│   ├── catalog/        # [PENDING]
│   ├── purchases/      # [PENDING]
│   ├── sales/          # [PENDING]
│   ├── warehouse/      # [PENDING]
│   └── dashboard/      # [PENDING]
│
└── tests/
    ├── __init__.py
    ├── conftest.py                              # db_session, client, unauthenticated_client fixtures
    └── admin/
        ├── __init__.py
        ├── test_department_list.py
        ├── test_department_create.py
        ├── test_department_update.py
        ├── test_department_delete.py
        └── test_department_get_by_id.py
```

---

## Key design decisions

### Global API prefix
All routers are mounted under `/api/v1` in `router_registry.py`.

| Module | Router prefix | Example endpoint         |
|--------|--------------|--------------------------|
| auth   | `/auth`      | `POST /api/v1/auth/login`  |
| auth   | `/auth`      | `POST /api/v1/auth/logout` |
| admin  | `/admin`     | `GET  /api/v1/admin/departments` |

### shared/config.py — Settings fields
| Field                    | Type   | Default       | Notes                              |
|--------------------------|--------|---------------|------------------------------------|
| `database_url`           | `str`  | —             | `postgresql+psycopg://...`         |
| `firebase_credentials_json` | `str` | —          | Firebase service account as JSON   |
| `environment`            | `str`  | `development` |                                    |
| `superadmin_email`       | `str`  | —             | Seeded on startup                  |
| `disable_auth`           | `bool` | `False`       | Bypass Firebase auth in dev (never set on Render) |

### shared/domain/entities/user.py — User ORM model (table: `users`)
| Column        | Type           | Constraints              |
|---------------|----------------|--------------------------|
| `id`          | Integer        | PK                       |
| `first_name`  | String(100)    | NOT NULL                 |
| `last_name`   | String(150)    | NOT NULL                 |
| `email`       | String(255)    | UNIQUE, NOT NULL         |
| `role`        | String(50)     | NOT NULL                 |
| `department_id` | Integer      | nullable (no FK yet)     |
| `is_active`   | Boolean        | NOT NULL, default True   |
| `created_at`  | DateTime(tz)   | server_default=now()     |
| `updated_at`  | DateTime(tz)   | server_default=now(), onupdate=now() |

> `department_id` has no FK constraint yet — will be added once the `departments` table migration runs.

### modules/admin/domain/entities/department.py — Department ORM model (table: `departments`)
| Column          | Type        | Constraints      |
|-----------------|-------------|------------------|
| `department_id` | Integer     | PK               |
| `name`          | String(100) | UNIQUE, NOT NULL |

### composition/dependencies.py — FastAPI dependency functions
| Function                         | Returns                   |
|----------------------------------|---------------------------|
| `get_current_user`               | `UserSession`             |
| `get_list_departments_use_case`  | `IListDepartmentsUseCase` |
| `get_create_department_use_case` | `ICreateDepartmentUseCase`|
| `get_update_department_use_case` | `IUpdateDepartmentUseCase`|
| `get_delete_department_use_case` | `IDeleteDepartmentUseCase`|
| `get_get_department_use_case`    | `IGetDepartmentUseCase`   |

`get_current_user` verifies the Firebase Bearer token and resolves the matching active `User` from the DB, returning a `UserSession` dataclass. Used by auth `/logout` and all `/admin` endpoints.

### modules/auth — DTOs
- `LoginRequestDTO`: `firebase_id_token: str`
- `LoginResponseDTO`: `role: str`, `department_id: int | None`, `name: str`
- `UserSession` (domain dataclass): `email`, `role`, `department_id`, `firebase_uid`, `name`

### modules/admin — HTTP schemas (schemas.py)
- `DepartmentDTO`: `department_id: int`, `name: str`
- `CreateDepartmentDTO`: `name: str` (min_length=1, max_length=100)
- `UpdateDepartmentDTO`: `name: str` (min_length=1, max_length=100)

### Error handling in admin router
| Condition                              | HTTP status |
|----------------------------------------|-------------|
| `IntegrityError` (duplicate name)      | 409         |
| `ValueError("... not found")`          | 404         |
| `ValueError` (other, e.g. FK conflict) | 409         |

### Security — Firebase split into two files
| File                      | Exports                                              |
|---------------------------|------------------------------------------------------|
| `firebase_client.py`      | `init_firebase_app()` — called in lifespan           |
| `firebase_auth_provider.py` | `verify_firebase_token(id_token)`, `revoke_firebase_tokens(uid)` |

### Alembic
- `env.py` uses `asyncio.run(run_migrations_online(), loop_factory=lambda: asyncio.SelectorEventLoop(...))` for Windows compatibility.
- Imports `shared.domain.entities.user` with `# noqa: F401` to register the model with `Base.metadata` for autogenerate.
- Migrations chain: `f4069b602566_init` → `890e4ffe7ec7_create_usuarios_table` (creates `users` table).

### Tests
- `conftest.py` fixtures: `db_session` (transaction-scoped, rolled back after each test), `client` (overrides `get_db` and `get_current_user`), `unauthenticated_client`.
- All tests in `tests/admin/` test the HTTP layer against a real in-memory DB session.

---

## Modules pending implementation

The following modules are planned but not yet started. Each will follow the same DDD structure as `auth` and `admin`:

```
modules/
├── suppliers/
│   ├── application/
│   ├── domain/
│   │   ├── entities/
│   │   └── interfaces/
│   └── infrastructure/
│       ├── http/
│       └── repos/
├── clients/       (same structure)
├── catalog/       (same structure)
├── purchases/     (same structure)
├── sales/         (same structure)
├── warehouse/     (same structure)
└── dashboard/     (same structure)
```

---

## Running the backend

```bash
# Activate venv
source backend/.venv/Scripts/activate  # Windows git bash

# Run dev server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run migrations
alembic upgrade head

# Run tests
pytest

# Lint / format
ruff check .
ruff format .
```
