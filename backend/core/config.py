from typing import List
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DEBUG: bool = False
    PROJECT_NAME: str = "Santos Numismática"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    MFA_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    ALLOW_REGISTRATION: bool = False

    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def _secure_jwt_key(cls, v: str) -> str:
        if len(v) < 32 or v == "troca_essa_chave":
            raise ValueError(
                'JWT_SECRET_KEY inseguro: gere uma chave com python -c "import secrets; print(secrets.token_urlsafe(48))"'
            )
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
