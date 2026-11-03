"""Integration test against a real PostgreSQL. Runs only when TEST_DATABASE_URL points to Postgres (CI)."""
import os

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.seed import ensure_seed
from app.services import TicketingService
from app.sql_repository import SqlRepository

URL = os.environ.get("TEST_DATABASE_URL", "")

pytestmark = pytest.mark.skipif(not URL.startswith("postgres"), reason="needs PostgreSQL (TEST_DATABASE_URL)")


def test_api_on_postgres():
    repo = SqlRepository(URL)
    ensure_seed(repo)
    client = TestClient(create_app(TicketingService(repo)))

    events = client.get("/api/events").json()
    assert len(events) == 3
    assert client.get(f"/api/events/{events[0]['id']}/units").status_code == 200

    login = client.post("/api/auth/login", json={"email": "controller@astana.kz", "password": "password123"})
    assert login.status_code == 200 and "access_token" in login.json()
