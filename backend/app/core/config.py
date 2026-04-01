from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "AI Platform"
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    debug: bool = False
    secret_key: str

    # Database
    database_url: str = "sqlite+aiosqlite:///./data/ai_platform.db"

    # JWT
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7
    jwt_algorithm: str = "HS256"

    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4-turbo-preview"
    openai_embedding_model: str = "text-embedding-3-small"
    openai_max_tokens: int = 4096

    # AWS S3 (optional — falls back to local storage)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"
    s3_bucket_name: Optional[str] = None
    s3_presigned_url_expiry: int = 3600

    # CORS — stored as plain string, parsed via property below
    # Accepts: comma-separated "http://a.com,http://b.com"
    # or JSON array: '["http://a.com"]'
    cors_origins_str: str = "http://localhost:3000,http://localhost:5173"

    # Rate Limiting
    rate_limit_per_minute: int = 60

    # Vector DB
    faiss_index_path: str = "./data/faiss_index"
    embedding_dimension: int = 1536

    # File Upload — stored as plain string, parsed via property below
    max_file_size_mb: int = 50
    allowed_file_types_str: str = (
        "application/pdf,"
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document,"
        "text/plain"
    )

    @property
    def cors_origins(self) -> List[str]:
        v = self.cors_origins_str.strip()
        if v.startswith("["):
            return json.loads(v)
        return [o.strip() for o in v.split(",") if o.strip()]

    @property
    def allowed_file_types(self) -> List[str]:
        v = self.allowed_file_types_str.strip()
        if v.startswith("["):
            return json.loads(v)
        return [o.strip() for o in v.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


settings = Settings()
