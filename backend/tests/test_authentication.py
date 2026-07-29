from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_register_new_user():
    response = client.post(
        "/api/auth/register",
        json={"username": "testuser", "password": "password123"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "testuser"
    assert "password" not in body


def test_register_duplicate_user():
    client.post(
        "/api/auth/register",
        json={"username": "dupeuser", "password": "password123"},
    )
    response = client.post(
        "/api/auth/register",
        json={"username": "dupeuser", "password": "password123"},
    )
    assert response.status_code == 409


def test_register_missing_fields():
    response = client.post("/api/auth/register", json={"username": "onlyuser"})
    assert response.status_code == 422


def test_login_valid_credentials():
    client.post(
        "/api/auth/register",
        json={"username": "loginuser", "password": "password123"},
    )
    response = client.post(
        "/api/auth/login",
        json={"username": "loginuser", "password": "password123"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password():
    client.post(
        "/api/auth/register",
        json={"username": "wrongpassuser", "password": "correctpass"},
    )
    response = client.post(
        "/api/auth/login",
        json={"username": "wrongpassuser", "password": "incorrectpass"},
    )
    assert response.status_code == 401


def test_login_nonexistent_user():
    response = client.post(
        "/api/auth/login",
        json={"username": "ghostuser", "password": "whatever"},
    )
    assert response.status_code == 401
