import uuid

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


@pytest.fixture
def authentication_headers():
    username = f"user_{uuid.uuid4().hex}"
    password = "password123"

    client.post(
        "/api/auth/register",
        json={
            "username": username,
            "password": password,
        },
    )

    response = client.post(
        "/api/auth/login",
        json={
            "username": username,
            "password": password,
        },
    )

    return {
        "Authorization": f"Bearer {response.json()['access_token']}",
    }


def create_vehicle(authentication_headers, quantity=5):
    response = client.post(
        "/api/vehicles",
        headers=authentication_headers,
        json={
            "make": "Toyota",
            "model": "Corolla",
            "category": "Sedan",
            "price": 25000,
            "quantity": quantity,
        },
    )

    assert response.status_code == 201
    return response.json()


def test_purchase_vehicle_success(authentication_headers):
    vehicle = create_vehicle(authentication_headers, quantity=5)

    response = client.post(
        f"/api/inventory/{vehicle['id']}/purchase",
        headers=authentication_headers,
    )

    assert response.status_code == 200
    assert response.json()["quantity"] == 4


def test_purchase_vehicle_when_quantity_is_zero(authentication_headers):
    vehicle = create_vehicle(authentication_headers, quantity=0)

    response = client.post(
        f"/api/inventory/{vehicle['id']}/purchase",
        headers=authentication_headers,
    )

    assert response.status_code == 200
    assert response.json()["quantity"] == 0


def test_purchase_vehicle_not_found(authentication_headers):
    response = client.post(
        "/api/inventory/999999/purchase",
        headers=authentication_headers,
    )

    assert response.status_code == 404


def test_purchase_vehicle_unauthorized():
    response = client.post("/api/inventory/1/purchase")

    assert response.status_code in (401, 403)


def test_restock_vehicle_success(authentication_headers):
    vehicle = create_vehicle(authentication_headers, quantity=5)

    response = client.post(
        f"/api/inventory/{vehicle['id']}/restock",
        headers=authentication_headers,
        json={"quantity": 10},
    )

    assert response.status_code == 200
    assert response.json()["quantity"] == 15


def test_restock_vehicle_not_found(authentication_headers):
    response = client.post(
        "/api/inventory/999999/restock",
        headers=authentication_headers,
        json={"quantity": 10},
    )

    assert response.status_code == 404


def test_restock_vehicle_unauthorized():
    response = client.post(
        "/api/inventory/1/restock",
        json={"quantity": 10},
    )

    assert response.status_code in (401, 403)
