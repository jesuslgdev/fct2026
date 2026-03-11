# Backend — fct2026

FastAPI backend for an ERP system. Deployed to Render via Docker.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.130.0 |
| Database | PostgreSQL 16 + SQLAlchemy async (psycopg3) |
| Migrations | Alembic |
| Auth | Firebase Admin SDK |
| Config | pydantic-settings |
| Packaging | Poetry |
| Linting | Ruff |
| Testing | Pytest + pytest-asyncio + pytest-cov |
| Deploy | Docker + Render |

---

## Project structure

```
backend/
├── alembic/                  # Database migrations
│   └── versions/
├── composition/
│   ├── dependencies.py       # Auth dependency (get_current_user)
│   └── router_registry.py    # Central router registration
├── modules/                  # Feature modules (one folder per domain)
├── shared/
│   ├── config.py             # Settings loaded from env vars
│   ├── domain/entities/      # ORM models
│   └── infrastructure/
│       ├── database/         # Engine, session factory, seed
│       └── security/         # Firebase token verification
├── main.py                   # App entry point
├── Dockerfile
├── docker-compose.yml
└── pyproject.toml
```

---

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Async PostgreSQL URL (`postgresql+psycopg://...`) |
| `FIREBASE_CREDENTIALS_JSON` | Firebase service account JSON as a string |
| `SUPERADMIN_EMAIL` | Email used to seed the initial super-admin |
| `ENVIRONMENT` | `development` / `staging` / `production` |

Copy `.env.example` to `.env` for local development.

---

## Local development

```bash
# Start API + PostgreSQL
docker compose up --build

# API available at http://localhost:8000
```

Run migrations after first start:

```bash
docker compose exec api alembic upgrade head
```

---

## Running tests

```bash
poetry run pytest
```

---

## Linting and formatting

```bash
# Lint
poetry run ruff check .

# Format
poetry run ruff format .
```

Pre-commit hooks run ruff automatically on every commit.
Install them once after cloning:

```bash
poetry install
pre-commit install
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/ready` | Readiness check (DB connectivity) |

---

## CI/CD

| Workflow | Trigger | Steps |
|---|---|---|
| `ci.yml` | PR to `main` or `development` | Lint → Format check → Tests |
| `deploy.yml` | Push to `development` | Tests → Deploy to Render |

---

## Deployment (Render)

- **Runtime**: Docker
- **Docker Build Context**: `backend`
- **Dockerfile Path**: `backend/Dockerfile`
- **Health Check Path**: `/health`
- **Port**: injected by Render as `$PORT`

Environment variables are configured in the Render dashboard.
