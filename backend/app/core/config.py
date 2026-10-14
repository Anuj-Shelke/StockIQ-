import json
from typing import Any, List, Optional, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    # Project Information
    PROJECT_NAME: str = "StockIQ API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    TESTING: bool = False

    # Security & JWT Auth
    SECRET_KEY: str = "development-secret-key-change-in-production-only-32bytes"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOW_SQLITE_FALLBACK: bool = False
    SEED_DEFAULT_DATA: bool = False
    GOOGLE_CLIENT_ID: Optional[str] = None

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:8501",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8501",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # PostgreSQL Database
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "stockiq"
    DATABASE_URL: Optional[str] = None
    ASYNC_DATABASE_URL: Optional[str] = None

    # Market Data
    MARKET_DATA_PROVIDER: str = "yfinance"
    MARKET_DATA_API_KEY: Optional[str] = ""

    # LLM & RAG
    LLM_PROVIDER: str = "gemini"
    LLM_API_KEY: Optional[str] = ""
    GEMINI_API_KEY: Optional[str] = None
    CLAUDE_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"

    # Email
    EMAIL_PROVIDER: str = "resend"
    EMAIL_API_KEY: Optional[str] = ""
    FROM_EMAIL: str = "StockIQ Alerts <onboarding@resend.dev>"
    RESEND_API_KEY: Optional[str] = None
    ADMIN_NOTIFY_EMAIL: Optional[str] = None
    ADMIN_EMAIL: Optional[str] = None
    ADMIN_PASSWORD: Optional[str] = None
    ADMIN_NAME: Optional[str] = None

    # Supabase (Optional)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    @model_validator(mode="before")
    @classmethod
    def assemble_db_urls(cls, values: Any) -> Any:
        if isinstance(values, dict):
            user = values.get("POSTGRES_USER") or "postgres"
            password = values.get("POSTGRES_PASSWORD") or "postgres"
            host = values.get("POSTGRES_HOST") or values.get("POSTGRES_SERVER") or "localhost"
            port = values.get("POSTGRES_PORT") or 5432
            db = values.get("POSTGRES_DB") or "stockiq"

            if not values.get("DATABASE_URL"):
                values["DATABASE_URL"] = f"postgresql+psycopg://{user}:{password}@{host}:{port}/{db}"
            if not values.get("ASYNC_DATABASE_URL"):
                values["ASYNC_DATABASE_URL"] = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{db}"
        return values

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
