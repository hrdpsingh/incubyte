import uuid

import pytest
from database import LocalSession
from fastapi.testclient import TestClient
from main import app
from model import User

client = TestClient(app)

DEFAULT_VEHICLE = {
    "make": "Toyota",
    "model": "Corolla",
    "category": "Sedan",
    "price": 25000,
}


def create_user_and_login(is_admin: bool = False):
    username = f"user_{uuid.uuid4().hex}"
    password = "password123"

    client.post("/api/auth/register", json={"username": username, "password": password})

    if is_admin:
        with LocalSession() as database:
            user = database.query(User).filter(User.username == username).first()
            if user:
                user.is_admin = True
                database.commit()

    res = client.post(
        "/api/auth/login", json={"username": username, "password": password}
    )
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture
def authentication_headers():
    return create_user_and_login(is_admin=False)


@pytest.fixture
def admin_authentication_headers():
    return create_user_and_login(is_admin=True)


def create_vehicle(headers, quantity=5):
    payload = {**DEFAULT_VEHICLE, "quantity": quantity}
    response = client.post("/api/vehicles", headers=headers, json=payload)
    assert response.status_code == 201
    return response.json()


class TestUserRegistration:
    def test_register_new_user(self):
        response = client.post(
            "/api/auth/register",
            json={"username": "testuser", "password": "password123"},
        )
        assert response.status_code == 201
        body = response.json()
        assert body["username"] == "testuser"
        assert "password" not in body

    def test_register_duplicate_user(self):
        user_data = {"username": "dupeuser", "password": "password123"}
        client.post("/api/auth/register", json=user_data)
        response = client.post("/api/auth/register", json=user_data)
        assert response.status_code == 409

    def test_register_missing_fields(self):
        response = client.post("/api/auth/register", json={"username": "onlyuser"})
        assert response.status_code == 422


class TestUserLogin:
    def test_login_valid_credentials(self):
        user_data = {"username": "loginuser", "password": "password123"}
        client.post("/api/auth/register", json=user_data)
        response = client.post("/api/auth/login", json=user_data)

        assert response.status_code == 200
        body = response.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_login_wrong_password(self):
        client.post(
            "/api/auth/register",
            json={"username": "wrongpassuser", "password": "correctpass"},
        )
        response = client.post(
            "/api/auth/login",
            json={"username": "wrongpassuser", "password": "incorrectpass"},
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self):
        response = client.post(
            "/api/auth/login",
            json={"username": "ghostuser", "password": "whatever"},
        )
        assert response.status_code == 401


class TestVehicleManagement:
    def test_create_vehicle(self, admin_authentication_headers):
        vehicle = create_vehicle(admin_authentication_headers)
        assert vehicle["make"] == "Toyota"
        assert vehicle["quantity"] == 5

    def test_create_vehicle_non_admin_forbidden(self, authentication_headers):
        payload = {**DEFAULT_VEHICLE, "quantity": 5}
        response = client.post(
            "/api/vehicles", headers=authentication_headers, json=payload
        )
        assert response.status_code == 403

    def test_list_vehicles(self, authentication_headers, admin_authentication_headers):
        create_vehicle(admin_authentication_headers)
        response = client.get("/api/vehicles", headers=authentication_headers)
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_search_vehicles(
        self, authentication_headers, admin_authentication_headers
    ):
        create_vehicle(admin_authentication_headers)
        response = client.get(
            "/api/vehicles/search",
            headers=authentication_headers,
            params={"make": "Toyota"},
        )
        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_update_vehicle(self, admin_authentication_headers):
        vehicle = create_vehicle(admin_authentication_headers)
        response = client.put(
            f"/api/vehicles/{vehicle['id']}",
            headers=admin_authentication_headers,
            json={
                "make": "Honda",
                "model": "Civic",
                "category": "Sedan",
                "price": 26000,
                "quantity": 10,
            },
        )
        assert response.status_code == 200
        assert response.json()["make"] == "Honda"

    def test_update_vehicle_non_admin_forbidden(
        self, authentication_headers, admin_authentication_headers
    ):
        vehicle = create_vehicle(admin_authentication_headers)
        response = client.put(
            f"/api/vehicles/{vehicle['id']}",
            headers=authentication_headers,
            json={"make": "Honda"},
        )
        assert response.status_code == 403

    def test_delete_vehicle(self, admin_authentication_headers):
        vehicle = create_vehicle(admin_authentication_headers)

        response = client.delete(
            f"/api/vehicles/{vehicle['id']}",
            headers=admin_authentication_headers,
        )
        assert response.status_code == 204

        response = client.get("/api/vehicles", headers=admin_authentication_headers)
        assert response.json() == []


class TestInventoryPurchases:
    def test_purchase_vehicle_success(
        self, authentication_headers, admin_authentication_headers
    ):
        vehicle = create_vehicle(admin_authentication_headers, quantity=5)

        response = client.post(
            f"/api/vehicles/{vehicle['id']}/purchase",
            headers=authentication_headers,
        )
        assert response.status_code == 200
        assert response.json()["quantity"] == 4

    def test_purchase_vehicle_when_quantity_is_zero(
        self, authentication_headers, admin_authentication_headers
    ):
        vehicle = create_vehicle(admin_authentication_headers, quantity=0)

        response = client.post(
            f"/api/vehicles/{vehicle['id']}/purchase",
            headers=authentication_headers,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Vehicle is out of stock"

    def test_purchase_vehicle_not_found(self, authentication_headers):
        response = client.post(
            "/api/vehicles/999999/purchase",
            headers=authentication_headers,
        )
        assert response.status_code == 404

    def test_purchase_vehicle_unauthorized(self):
        response = client.post("/api/vehicles/1/purchase")
        assert response.status_code in (401, 403)


class TestInventoryRestocking:
    def test_restock_vehicle_success(self, admin_authentication_headers):
        vehicle = create_vehicle(admin_authentication_headers, quantity=5)

        response = client.post(
            f"/api/vehicles/{vehicle['id']}/restock",
            headers=admin_authentication_headers,
            json={"quantity": 10},
        )
        assert response.status_code == 200
        assert response.json()["quantity"] == 15

    def test_restock_vehicle_not_found(self, admin_authentication_headers):
        response = client.post(
            "/api/vehicles/999999/restock",
            headers=admin_authentication_headers,
            json={"quantity": 10},
        )
        assert response.status_code == 404

    def test_restock_vehicle_unauthorized(self):
        response = client.post("/api/vehicles/1/restock", json={"quantity": 10})
        assert response.status_code in (401, 403)
