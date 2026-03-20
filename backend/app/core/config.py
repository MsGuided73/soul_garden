"""
Soul Garden Configuration
Pydantic settings for environment variables and app configuration.
"""

from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Get the backend directory (where this file lives)
BACKEND_DIR = Path(__file__).parent.parent.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    # App
    APP_NAME: str = "Soul Garden"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = Field(default=False)
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Supabase
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_KEY: str = Field(..., description="Supabase service role key")
    
    # OpenAI
    OPENAI_API_KEY: str = Field(..., description="OpenAI API key for embeddings and LLM")
    OPENAI_MODEL: str = Field(default="gpt-4o-mini", description="Default LLM model")
    EMBEDDING_MODEL: str = Field(default="text-embedding-3-small", description="Embedding model")
    EMBEDDING_DIMENSIONS: int = Field(default=1536, description="Embedding vector dimensions")
    
    # Agent Configuration
    DEFAULT_REFLECTION_DEPTH: int = Field(default=3, ge=1, le=5)
    DEFAULT_AUTO_REFLECT_INTERVAL: int = Field(default=3600, ge=60)  # seconds
    MAX_WORKING_MEMORY_TOKENS: int = Field(default=8000)
    MAX_RAG_RESULTS: int = Field(default=10)
    SIMILARITY_THRESHOLD: float = Field(default=0.7, ge=0.0, le=1.0)
    
    # Storage
    STORAGE_TYPE: str = Field(default="local", description="local, s3, or supabase")
    STORAGE_PATH: str = Field(default="./storage", description="Local storage path (relative to backend dir or absolute)")
    
    # Optional: JWT for future auth
    JWT_SECRET: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    @computed_field
    @property
    def resolved_storage_path(self) -> Path:
        """Resolve storage path relative to backend directory if relative."""
        path = Path(self.STORAGE_PATH)
        if not path.is_absolute():
            path = BACKEND_DIR / path
        return path.resolve()
    
    @property
    def is_production(self) -> bool:
        return not self.DEBUG


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
