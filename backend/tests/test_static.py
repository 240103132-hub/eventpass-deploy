from fastapi.testclient import TestClient

from app.main import create_app


def test_serves_frontend_and_keeps_api(tmp_path, monkeypatch):
    (tmp_path / "index.html").write_text("<html>EventPass</html>")
    monkeypatch.setenv("STATIC_DIR", str(tmp_path))
    monkeypatch.setenv("DATABASE_URL", "memory")
    client = TestClient(create_app())

    assert "EventPass" in client.get("/").text
    assert "EventPass" in client.get("/events/1/checkout").text  # SPA fallback
    assert client.get("/api/events").status_code == 200
    missing = client.get("/api/nope")
    assert missing.status_code == 404 and missing.json()["code"] == "not_found"
