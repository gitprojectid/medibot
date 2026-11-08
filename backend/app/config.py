import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Healthcare AI Safety Assistant"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Fixed Local 3B LLM Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:3b")
    OLLAMA_FALLBACK_MODEL: str = os.getenv("OLLAMA_FALLBACK_MODEL", "qwen2.5-coder:3b")
    OLLAMA_TIMEOUT: int = int(os.getenv("OLLAMA_TIMEOUT", "120"))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./healthcare_ai.db")
    
    # Security & JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-healthcare-safety-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Feature Flags
    EMERGENCY_ENGINE_ENABLED: bool = True
    MEDICATION_ENGINE_ENABLED: bool = True
    RAG_ENABLED: bool = True
    RESPONSE_VALIDATOR_ENABLED: bool = True
    
    # Emergency Configuration
    EMERGENCY_PHONE_DEFAULT: str = "911"
    EMERGENCY_HELPLINE_CRISIS: str = "988"
    
    model_config = SettingsConfigDict(extra="allow", env_file=".env")

settings = Settings()
