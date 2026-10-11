from typing import Any, Optional
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "StockIQ API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # PostgreSQL Database
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "stockiq"
    DATABASE_URL: Optional[str] = None
    ASYNC_DATABASE_URL: Optional[str] = None

    # Security & JWT Auth
    SECRET_KEY: str = "default-insecure-development-secret-key-change-in-env"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Market Data
    MARKET_DATA_PROVIDER: str = "yfinance"
    MARKET_DATA_API_KEY: Optional[str] = None

    # LLM & RAG
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: Optional[str] = None
    CLAUDE_API_KEY: Optional[str] = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"

    # Email
    EMAIL_PROVIDER: str = "resend"
    EMAIL_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@stockiq.ai"

    @model_validator(mode="before")
    @classmethod
    def assemble_db_urls(cls, values: Any) -> Any:
        if isinstance(values, dict):
            user = values.get("POSTGRES_USER", "postgres")
            password = values.get("POSTGRES_PASSWORD", "postgres")
            host = values.get("POSTGRES_HOST", "localhost")
            port = values.get("POSTGRES_PORT", 5432)
            db = values.get("POSTGRES_DB", "stockiq")

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
