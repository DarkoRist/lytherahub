"""Application configuration using Pydantic Settings."""

from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """All application settings loaded from environment variables."""

    # App
    APP_NAME: str = "LytheraHub AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    DEMO_MODE: bool = False
    SECRET_KEY: str = "change-me-in-production"
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origins(self) -> list[str]:
        origins = [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]
        return origins

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://lytherahub:lytherahub_secret@localhost:5432/lytherahub"
    DB_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "jwt-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"

    # Anthropic (Claude AI)
    ANTHROPIC_API_KEY: Optional[str] = None
    AI_MODEL: str = "claude-sonnet-4-5-20250929"
    AI_MAX_TOKENS: int = 2048

    # Slack
    SLACK_BOT_TOKEN: Optional[str] = None
    SLACK_SIGNING_SECRET: Optional[str] = None
    SLACK_APP_TOKEN: Optional[str] = None

    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # n8n
    N8N_BASE_URL: str = "http://localhost:5678"
    N8N_API_KEY: Optional[str] = None

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Feature Flags
    ENABLE_EMAIL_SYNC: bool = True
    ENABLE_CALENDAR_SYNC: bool = True
    ENABLE_SLACK_NOTIFICATIONS: bool = True
    ENABLE_STRIPE_BILLING: bool = True
    ENABLE_N8N_AUTOMATIONS: bool = True

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
