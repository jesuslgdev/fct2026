# Stage 1: Export dependencies
FROM python:3.13-slim AS builder
WORKDIR /app
RUN pip install poetry poetry-plugin-export
COPY pyproject.toml poetry.lock ./
RUN poetry export -f requirements.txt -o requirements.txt --only main

# Stage 2: Production image
FROM python:3.13-slim
WORKDIR /app
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "main:app", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--workers", "4"]
