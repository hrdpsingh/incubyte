from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_create_vehicle():
    response = client.post(
        "/api/vehicles",
        json={
            "make": "Toyota",
            "model": "Corolla",
            "category": "Sedan",
            "price": 25000,
            "quantity": 5,
        },
    )

    assert response.status_code == 201


def test_list_vehicles():
    response = client.get("/api/vehicles")

    assert response.status_code == 200


def test_search_vehicles():
    response = client.get(
        "/api/vehicles/search",
        params={"make": "Toyota"},
    )

    assert response.status_code == 200


def test_update_vehicle():
    response = client.put(
        "/api/vehicles/1",
        json={
            "make": "Honda",
            "model": "Civic",
            "category": "Sedan",
            "price": 26000,
            "quantity": 10,
        },
    )

    assert response.status_code == 200


def test_delete_vehicle():
    response = client.delete("/api/vehicles/1")

    assert response.status_code == 204


def test_purchase_vehicle():
    response = client.post("/api/vehicles/1/purchase")

    assert response.status_code == 200


def test_restock_vehicle():
    response = client.post(
        "/api/vehicles/1/restock",
        json={"quantity": 5},
    )

    assert response.status_code == 200
