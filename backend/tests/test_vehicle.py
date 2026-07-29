import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


@pytest.fixture
def authentication_headers():
    client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "password": "password",
        },
    )

    response = client.post(
        "/api/auth/login",
        json={
            "username": "testuser",
            "password": "password",
        },
    )

    return {
        "Authorization": f"Bearer {response.json()['access_token']}",
    }


def create_vehicle(authentication_headers):
    response = client.post(
        "/api/vehicles",
        headers=authentication_headers,
        json={
            "make": "Toyota",
            "model": "Corolla",
            "category": "Sedan",
            "price": 25000,
            "quantity": 5,
        },
    )

    assert response.status_code == 201
    return response.json()


def test_create_vehicle(authentication_headers):
    vehicle = create_vehicle(authentication_headers)

    assert vehicle["make"] == "Toyota"
    assert vehicle["quantity"] == 5


def test_list_vehicles(authentication_headers):
    create_vehicle(authentication_headers)

    response = client.get(
        "/api/vehicles",
        headers=authentication_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_search_vehicles(authentication_headers):
    create_vehicle(authentication_headers)

    response = client.get(
        "/api/vehicles/search",
        headers=authentication_headers,
        params={"make": "Toyota"},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_update_vehicle(authentication_headers):
    vehicle = create_vehicle(authentication_headers)

    response = client.put(
        f"/api/vehicles/{vehicle['id']}",
        headers=authentication_headers,
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


def test_delete_vehicle(authentication_headers):
    vehicle = create_vehicle(authentication_headers)

    response = client.delete(
        f"/api/vehicles/{vehicle['id']}",
        headers=authentication_headers,
    )

    assert response.status_code == 204

    response = client.get(
        "/api/vehicles",
        headers=authentication_headers,
    )
    assert response.json() == []


def test_purchase_vehicle(authentication_headers):
    vehicle = create_vehicle(authentication_headers)

    response = client.post(
        f"/api/vehicles/{vehicle['id']}/purchase",
        headers=authentication_headers,
    )

    assert response.status_code == 200
    assert response.json()["quantity"] == 4


def test_restock_vehicle(authentication_headers):
    vehicle = create_vehicle(authentication_headers)

    response = client.post(
        f"/api/vehicles/{vehicle['id']}/restock",
        headers=authentication_headers,
        json={"quantity": 5},
    )

    assert response.status_code == 200
    assert response.json()["quantity"] == 10
