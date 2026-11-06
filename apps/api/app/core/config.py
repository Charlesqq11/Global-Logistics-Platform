from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parents[4]
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    app_name: str = "Global Logistics Platform"
    app_version: str = "1.0.0"
    app_env: str = "development"

    database_url: str
    redis_url: str = "redis://localhost:6379/0"

    secret_key: str
    jwt_secret_key: str

    access_token_expire_minutes: int = 30

    frontend_url: str = "http://localhost:3000"
    public_app_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"

    openai_api_key: str = ""
    openai_model: str = "gpt-6-astra"
    
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-20b"

    storage_endpoint: str = ""
    storage_bucket: str = ""
    storage_access_key: str = ""
    storage_secret_key: str = ""

    payment_proof_storage_path: str = "storage/payment-proofs"
    payment_proof_max_size_bytes: int = 10485760

    email_host: str = ""
    email_port: int = 587
    email_username: str = ""
    email_password: str = ""
    email_from: str = ""

    payment_provider: str = ""
    payment_secret_key: str = ""
    payment_webhook_secret: str = ""

    sms_provider: str = ""
    sms_api_key: str = ""
    sms_api_secret: str = ""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
