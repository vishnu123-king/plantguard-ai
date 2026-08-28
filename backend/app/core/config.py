import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "PlantGuard AI"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "sqlite:///./plantguard.db"
    
    AI_PROVIDER: str = "mock"
    AI_API_KEY: str = ""
    AI_MODEL: str = "gemini-2.5-flash"
    
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "webp"]
    ALLOWED_MIME_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5500",
        "http://localhost:8000",
        "*"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
