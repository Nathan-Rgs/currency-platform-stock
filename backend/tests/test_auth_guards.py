import pytest


@pytest.mark.parametrize("method,path", [
    ("post", "/api/v1/coins"),
    ("get", "/api/v1/coins"),
    ("delete", "/api/v1/coins/1"),
    ("post", "/api/v1/coins/import"),
    ("get", "/api/v1/dashboard/summary"),
    ("get", "/api/v1/admin/audit-logs"),
    ("get", "/api/v1/coins/export/all"),
])
def test_requires_auth(client, method, path):
    assert getattr(client, method)(path).status_code == 401


def test_register_disabled_by_default(client):
    r = client.post("/api/v1/auth/register", json={"email": "x@y.com", "password": "abcdefgh1"})
    assert r.status_code == 403
    assert r.json()["detail"] == "Registration is disabled."
