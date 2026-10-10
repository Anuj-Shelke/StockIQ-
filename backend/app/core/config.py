from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "StockIQ API"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"

    # Database & Supabase
    DATABASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # External APIs
    MARKET_DATA_API_KEY: str = ""
    LLM_API_KEY: str = ""
    EMAIL_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
