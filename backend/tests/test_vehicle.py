from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def create_vehicle():
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
    return response.json()


def test_create_vehicle():
    vehicle = create_vehicle()

    assert vehicle["make"] == "Toyota"
    assert vehicle["quantity"] == 5


def test_list_vehicles():
    create_vehicle()

    response = client.get("/api/vehicles")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_search_vehicles():
    create_vehicle()

    response = client.get(
        "/api/vehicles/search",
        params={"make": "Toyota"},
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_update_vehicle():
    vehicle = create_vehicle()

    response = client.put(
        f"/api/vehicles/{vehicle['id']}",
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


def test_delete_vehicle():
    vehicle = create_vehicle()

    response = client.delete(f"/api/vehicles/{vehicle['id']}")

    assert response.status_code == 204

    response = client.get("/api/vehicles")
    assert response.json() == []


def test_purchase_vehicle():
    vehicle = create_vehicle()

    response = client.post(f"/api/vehicles/{vehicle['id']}/purchase")

    assert response.status_code == 200
    assert response.json()["quantity"] == 4


def test_restock_vehicle():
    vehicle = create_vehicle()

    response = client.post(
        f"/api/vehicles/{vehicle['id']}/restock",
        json={"quantity": 5},
    )

    assert response.status_code == 200
    assert response.json()["quantity"] == 10
