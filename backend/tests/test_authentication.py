from conftest import LOGIN_URL, REGISTER_URL, USER_DATA
from fastapi import status


class TestUserRegistration:
    """Test suite for user registration endpoints."""

    def test_register_new_user(self, client):
        """Test successful registration of a new user with valid data."""
        response = client.post(REGISTER_URL, json=USER_DATA)
        body = response.json()

        assert response.status_code == status.HTTP_201_CREATED
        assert body["username"] == USER_DATA["username"]
        assert "password" not in body

    def test_register_duplicate_user(self, client):
        """Test that registering an existing user returns a 409 Conflict status."""
        client.post(REGISTER_URL, json=USER_DATA)
        response = client.post(REGISTER_URL, json=USER_DATA)

        assert response.status_code == status.HTTP_409_CONFLICT

    def test_register_missing_password(self, client):
        """Test that registering without a password fails validation with 422 Unprocessable Content."""
        payload = {key: value for key, value in USER_DATA.items() if key != "password"}
        response = client.post(REGISTER_URL, json=payload)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT


class TestUserLogin:
    """Test suite for user authentication endpoints."""

    def test_login_valid_credentials(self, client):
        """Test successful login returns a 200 OK status and a valid access token."""
        client.post(REGISTER_URL, json=USER_DATA)
        response = client.post(LOGIN_URL, json=USER_DATA)
        body = response.json()

        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_login_wrong_password(self, client):
        """Test that logging in with an incorrect password returns 401 Unauthorized."""
        client.post(REGISTER_URL, json=USER_DATA)
        response = client.post(LOGIN_URL, json={**USER_DATA, "password": "xyz"})

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, client):
        """Test that logging in with a non-existent user account returns 401 Unauthorized."""
        response = client.post(LOGIN_URL, json=USER_DATA)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
