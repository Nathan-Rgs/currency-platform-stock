import os

from cryptography.fernet import Fernet

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-0123456789-abcdefghijklmnop"
os.environ["MFA_SECRET_KEY"] = Fernet.generate_key().decode()

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models  # noqa: F401  (registers all tables on Base.metadata)
import routers.coins as coins_router
from core.database import Base, get_db
from core.security import create_access_token, hash_password
from main import app
from models.coin import Coin
from models.user import User


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, autoflush=False)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def user(db):
    u = User(
        email="owner@test.com",
        hashed_password=hash_password("secret123"),
        is_admin=True,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


@pytest.fixture
def auth_headers(user):
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


@pytest.fixture
def make_coin(db, user):
    def _make(**overrides):
        data = dict(
            title="Moeda teste",
            year=1994,
            country="Brasil",
            face_value="1 Real",
            quantity=1,
            owner_id=user.id,
        )
        data.update(overrides)
        coin = Coin(**data)
        db.add(coin)
        db.commit()
        db.refresh(coin)
        return coin

    return _make


@pytest.fixture
def media_dir(tmp_path, monkeypatch):
    path = tmp_path / "coins"
    monkeypatch.setattr(coins_router, "MEDIA_DIR", str(path))
    return path
