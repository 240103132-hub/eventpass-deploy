"""Render/Railway/Heroku hand out postgres:// or postgresql:// URLs; SQLAlchemy needs a driver name."""
import os

DEFAULT_URL = "sqlite:///eventpass.sqlite3"


def normalize_database_url(url: str) -> str:
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg2://" + url[len(prefix):]
    return url


def database_url() -> str:
    return normalize_database_url(os.environ.get("DATABASE_URL", DEFAULT_URL))
