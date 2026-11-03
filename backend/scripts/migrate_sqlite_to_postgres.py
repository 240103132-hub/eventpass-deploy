"""One-off data migration: copy every row from a SQLite file into PostgreSQL.

Usage (from backend/):
    python scripts/migrate_sqlite_to_postgres.py eventpass.sqlite3 "postgresql://user:pass@host:5432/db"

The target schema is created by Alembic (`alembic upgrade head`) if it does not exist yet.
Tables are copied in foreign-key order. Tables that already contain rows in the target are skipped.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import create_engine, func, insert, select  # noqa: E402

from app.database_url import normalize_database_url  # noqa: E402
from app.db_models import Base  # noqa: E402


def migrate(source_url: str, target_url: str) -> dict:
    if "://" not in source_url:  # a plain file path
        source_url = f"sqlite:///{source_url}"
    source = create_engine(normalize_database_url(source_url))
    target = create_engine(normalize_database_url(target_url))
    Base.metadata.create_all(target)  # no-op when Alembic already created the tables
    copied = {}
    with source.connect() as src, target.begin() as dst:
        for table in Base.metadata.sorted_tables:  # parents before children
            if dst.scalar(select(func.count()).select_from(table)):
                copied[table.name] = "skipped (target not empty)"
                continue
            rows = [dict(r._mapping) for r in src.execute(select(table))]
            if rows:
                dst.execute(insert(table), rows)
            copied[table.name] = len(rows)
    return copied


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    for name, result in migrate(sys.argv[1], sys.argv[2]).items():
        print(f"{name}: {result}")
