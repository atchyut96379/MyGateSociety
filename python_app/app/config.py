from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = (
        "mssql+pymssql://sa:MyGate_Dev12345@localhost:1433/mygatesociety"
    )
    jwt_secret: str = "change-this-in-production-use-32-bytes"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60 * 24 * 7
    app_name: str = "Marvel Rocks Society API"
    environment: str = "development"
    sqlserver_edition: str = "Developer"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""
    cors_origins: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="",
        extra="ignore",
    )


settings = Settings()
