from fastapi.testclient import TestClient

from app.main import create_app


def test_cors_allows_vercel_and_localhost_only(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "memory")
    client = TestClient(create_app())
    cases = [
        ("https://eventpass-abc.vercel.app", True),
        ("http://localhost:5173", True),
        ("https://evil.example.com", False),
    ]
    for origin, allowed in cases:
        res = client.get("/api/venues", headers={"Origin": origin})
        assert (res.headers.get("access-control-allow-origin") == origin) is allowed
