# Application settings loaded from environment variables.
# Uses pydantic-settings to automatically read values from the .env file
# and validate their types at startup.
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Full async-compatible PostgreSQL connection string (psycopg3 driver)
    database_url: str
    # Firebase service account credentials as a JSON string
    firebase_credentials_json: str
    # Firebase Web API key used as a fallback for ID token validation.
    firebase_web_api_key: str | None = None
    # Runtime environment: "development", "staging", or "production"
    environment: str = "development"
    # Email address used to seed the initial superadmin account
    superadmin_email: str
    # Set to True locally to bypass Firebase auth (never set this on Render)
    disable_auth: bool = False
    # Days before a purchase/sale is considered stale in dashboard alerts.
    dashboard_stale_days: int = 7
    # Number of recent purchase/sale rows returned by dashboard (clamped 5..10).
    dashboard_recent_limit: int = 5

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Singleton instance imported throughout the application
settings = Settings()
