from conftest import RESTOCK_VEHICLE, VEHICLE_DATA, VEHICLE_URL
from fastapi import status


class TestAdminOperations:
    """Test suite for admin-only vehicle operations."""

    def test_create_vehicle(self, admin_authentication_headers, create_vehicle):
        """Test that an admin can successfully create a new vehicle."""
        vehicle = create_vehicle(admin_authentication_headers)
        assert vehicle["make"] == VEHICLE_DATA["make"]
        assert vehicle["quantity"] == VEHICLE_DATA.get("quantity", 5)

    def test_update_vehicle(self, client, admin_authentication_headers, create_vehicle):
        """Test that an admin can update existing vehicle details."""
        vehicle = create_vehicle(admin_authentication_headers)

        update_payload = {
            **VEHICLE_DATA,
            "make": "Honda",
            "model": "Civic",
            "category": "Sedan",
            "price": 26000,
            "quantity": 10,
        }

        response = client.put(
            f"{VEHICLE_URL}/{vehicle['id']}",
            headers=admin_authentication_headers,
            json=update_payload,
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["make"] == update_payload["make"]

    def test_delete_vehicle(self, client, admin_authentication_headers, create_vehicle):
        """Test that an admin can delete a vehicle from the system."""
        vehicle = create_vehicle(admin_authentication_headers)

        response = client.delete(
            f"{VEHICLE_URL}/{vehicle['id']}",
            headers=admin_authentication_headers,
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

        response = client.get(VEHICLE_URL, headers=admin_authentication_headers)
        assert response.json() == []

    def test_restock_vehicle_success(
        self, client, admin_authentication_headers, create_vehicle
    ):
        """Test that an admin can restock a vehicle's inventory quantity."""
        initial_quantity = 5
        vehicle = create_vehicle(
            admin_authentication_headers, quantity=initial_quantity
        )

        response = client.post(
            f"{VEHICLE_URL}/{vehicle['id']}/restock",
            headers=admin_authentication_headers,
            json=RESTOCK_VEHICLE,
        )
        assert response.status_code == status.HTTP_200_OK
        assert (
            response.json()["quantity"]
            == initial_quantity + RESTOCK_VEHICLE["quantity"]
        )

    def test_restock_vehicle_not_found(self, client, admin_authentication_headers):
        """Test restocking a non-existent vehicle returns a 404 error."""
        response = client.post(
            f"{VEHICLE_URL}/999999/restock",
            headers=admin_authentication_headers,
            json=RESTOCK_VEHICLE,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestUserOperations:
    """Test suite for standard user operations and permissions checks."""

    def test_list_vehicles(
        self,
        client,
        authentication_headers,
        admin_authentication_headers,
        create_vehicle,
    ):
        """Test that an authenticated user can list available vehicles."""
        create_vehicle(admin_authentication_headers)
        response = client.get(VEHICLE_URL, headers=authentication_headers)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 1

    def test_search_vehicles(
        self,
        client,
        authentication_headers,
        admin_authentication_headers,
        create_vehicle,
    ):
        """Test searching vehicles by query parameter as a user."""
        create_vehicle(admin_authentication_headers)
        response = client.get(
            f"{VEHICLE_URL}/search",
            headers=authentication_headers,
            params={"query": VEHICLE_DATA["make"]},
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 1

    def test_purchase_vehicle_success(
        self,
        client,
        authentication_headers,
        admin_authentication_headers,
        create_vehicle,
    ):
        """Test successful purchase of an available vehicle by a user."""
        initial_quantity = 5
        vehicle = create_vehicle(
            admin_authentication_headers, quantity=initial_quantity
        )

        response = client.post(
            f"{VEHICLE_URL}/{vehicle['id']}/purchase",
            headers=authentication_headers,
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["quantity"] == initial_quantity - 1

    def test_purchase_vehicle_zero_quantity(
        self,
        client,
        authentication_headers,
        admin_authentication_headers,
        create_vehicle,
    ):
        """Test purchasing an out-of-stock vehicle returns a 400 error."""
        vehicle = create_vehicle(admin_authentication_headers, quantity=0)

        response = client.post(
            f"{VEHICLE_URL}/{vehicle['id']}/purchase",
            headers=authentication_headers,
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["detail"] == "Vehicle is out of stock"

    def test_purchase_vehicle_not_found(self, client, authentication_headers):
        """Test purchasing a non-existent vehicle returns a 404 error."""
        response = client.post(
            f"{VEHICLE_URL}/999999/purchase",
            headers=authentication_headers,
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_purchase_vehicle_unauthorized(self, client):
        """Test purchasing a vehicle without authentication headers fails."""
        response = client.post(f"{VEHICLE_URL}/1/purchase")
        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_restock_vehicle_unauthorized(self, client):
        """Test restocking a vehicle without authentication headers fails."""
        response = client.post(f"{VEHICLE_URL}/1/restock", json=RESTOCK_VEHICLE)
        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_create_vehicle_forbidden(self, client, authentication_headers):
        """Test standard users are forbidden from creating vehicles."""
        payload = {**VEHICLE_DATA, "quantity": 5}
        response = client.post(
            VEHICLE_URL, headers=authentication_headers, json=payload
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_vehicle_forbidden(
        self,
        client,
        authentication_headers,
        admin_authentication_headers,
        create_vehicle,
    ):
        """Test standard users are forbidden from updating vehicles."""
        vehicle = create_vehicle(admin_authentication_headers)
        response = client.put(
            f"{VEHICLE_URL}/{vehicle['id']}",
            headers=authentication_headers,
            json={**VEHICLE_DATA, "make": "Honda"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
