from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    nexus_name: str = "NEXUS"
    nexus_db_path: str = "data/nexus.sqlite3"
    llm_base_url: str = "http://localhost:11434/v1"
    llm_api_key: str = "ollama"
    llm_model: str = ""
    llm_timeout_seconds: float = 90.0

    @property
    def database_path(self) -> Path:
        return Path(self.nexus_db_path)


@lru_cache
def get_settings() -> Settings:
    return Settings()
