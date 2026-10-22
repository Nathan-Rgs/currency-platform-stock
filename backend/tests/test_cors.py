from fastapi import FastAPI
from pydantic import AnyHttpUrl, TypeAdapter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient

from core.config import settings
from main import cors_origins


def _urls():
    return [TypeAdapter(AnyHttpUrl).validate_python("http://localhost:8080")]


def test_cors_origins_have_no_trailing_slash(monkeypatch):
    monkeypatch.setattr(settings, "BACKEND_CORS_ORIGINS", _urls())
    assert cors_origins() == ["http://localhost:8080"]


def test_cors_allows_only_configured_origin(monkeypatch):
    monkeypatch.setattr(settings, "BACKEND_CORS_ORIGINS", _urls())
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware, allow_origins=cors_origins(), allow_credentials=True,
        allow_methods=["*"], allow_headers=["*"],
    )

    @app.get("/")
    def root():
        return {}

    c = TestClient(app)
    ok = c.get("/", headers={"Origin": "http://localhost:8080"})
    assert ok.headers["access-control-allow-origin"] == "http://localhost:8080"
    bad = c.get("/", headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in bad.headers
