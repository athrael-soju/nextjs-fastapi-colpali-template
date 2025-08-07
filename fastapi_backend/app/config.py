from typing import Set
import os
import torch
from typing import Final
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # OpenAPI docs
    OPENAPI_URL: str = "/openapi.json"

    # Database
    DATABASE_URL: str
    TEST_DATABASE_URL: str | None = None
    EXPIRE_ON_COMMIT: bool = False

    # User
    ACCESS_SECRET_KEY: str
    RESET_PASSWORD_SECRET_KEY: str
    VERIFICATION_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_SECONDS: int = 3600

    # Email
    MAIL_USERNAME: str | None = None
    MAIL_PASSWORD: str | None = None
    MAIL_FROM: str | None = None
    MAIL_SERVER: str | None = None
    MAIL_PORT: int | None = None
    MAIL_FROM_NAME: str = "FastAPI template"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True
    TEMPLATE_DIR: str = "email_templates"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # CORS
    CORS_ORIGINS: Set[str]

    # ===== Colpali Settings =====
    # Core Application
    LOG_LEVEL: Final[str] = os.getenv("LOG_LEVEL", "INFO")
    STORAGE_TYPE: Final[str] = os.getenv("STORAGE_TYPE", "qdrant")  # "memory" or "qdrant"

    # Processing
    DEFAULT_TOP_K: Final[int] = int(os.getenv("DEFAULT_TOP_K", "5"))
    MAX_TOKENS: Final[int] = int(os.getenv("MAX_TOKENS", "-1"))
    BATCH_SIZE: Final[int] = int(os.getenv("BATCH_SIZE", "4"))
    WORKER_THREADS: Final[int] = int(os.getenv("WORKER_THREADS", "4"))

    # ===== AI/ML Configuration =====
    # OpenAI
    OPENAI_API_KEY: Final[str] = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: Final[str] = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    # Embedding Model
    MODEL_NAME: Final[str] = os.getenv("MODEL_NAME", "nomic-ai/colnomic-embed-multimodal-3b")
    MODEL_DEVICE: Final[str] = os.getenv(
        "MODEL_DEVICE", 
        "cuda:0" if torch.cuda.is_available() else "cpu"
    )

    # ===== Storage Configurations =====
    # Qdrant
    QDRANT_URL: Final[str] = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_COLLECTION_NAME: Final[str] = os.getenv("QDRANT_COLLECTION_NAME", "documents")
    QDRANT_SEARCH_LIMIT: Final[int] = int(os.getenv("QDRANT_SEARCH_LIMIT", "20"))
    QDRANT_PREFETCH_LIMIT: Final[int] = int(os.getenv("QDRANT_PREFETCH_LIMIT", "200"))

    # MinIO Object Storage
    MINIO_URL: Final[str] = os.getenv("MINIO_URL", "http://localhost:9000")
    MINIO_ACCESS_KEY: Final[str] = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: Final[str] = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_BUCKET_NAME: Final[str] = os.getenv("MINIO_BUCKET_NAME", "documents")

    # In-Memory Storage
    IN_MEMORY_URL: Final[str] = os.getenv("IN_MEMORY_URL", "http://localhost:6333")
    IN_MEMORY_NUM_IMAGES: Final[int] = int(os.getenv("IN_MEMORY_NUM_IMAGES", "500"))

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

settings = Settings()
