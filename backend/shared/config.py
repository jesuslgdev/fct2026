# Application settings loaded from environment variables.
# Uses pydantic-settings to automatically read values from the .env file
# and validate their types at startup.
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Full async-compatible PostgreSQL connection string (psycopg3 driver)
    database_url: str
    # Firebase service account credentials as a JSON string
    firebase_credentials_json: str
    # Runtime environment: "development", "staging", or "production"
    environment: str = "development"
    # Email address used to seed the initial superadmin account
    superadmin_email: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Singleton instance imported throughout the application
settings = Settings()