"""Application configuration via Pydantic Settings."""
from __future__ import annotations

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    app_name: str = "Smart Carbon Credit Analytics Platform"
    app_version: str = "1.0.0"
    debug: bool = False

    # Security
    secret_key: str = "change-me-in-production-32-plus-chars!!"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Database
    database_url: str = "sqlite:///./backend.db"

    # CORS
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://localhost:8080"

    # Paths
    reports_dir: str = "reports"
    uploads_dir: str = "uploads"
    logs_dir: str = "logs"
    model_path: str = "app/ai/best_bilstm.keras"
    scaler_path: str = "app/ai/scaler.pkl"

    # Rate Limiting
    rate_limit: str = "100/minute"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
