from fastapi.testclient import TestClient

from app.main import create_app


def test_health_reports_environment_and_version(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "memory")
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("RENDER_GIT_COMMIT", "abc123")
    body = TestClient(create_app()).get("/api/health").json()
    assert body == {"status": "ok", "env": "development", "version": "abc123"}
