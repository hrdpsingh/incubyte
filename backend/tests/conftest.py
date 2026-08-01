import pytest
from database import get_session
from fastapi.testclient import TestClient
from main import app
from model import User
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

REGISTER_URL = "/api/authentication/register"
LOGIN_URL = "/api/authentication/login"
VEHICLE_URL = "/api/vehicles"

USER_DATA = {"username": "Bob", "password": "123"}
RESTOCK_VEHICLE = {"quantity": 10}
VEHICLE_DATA = {
    "make": "Toyota",
    "model": "Corolla",
    "category": "Sedan",
    "price": 25000,
}

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def get_test_session():
    """Yield an active SQLModel database session connected to the in-memory test engine."""
    with Session(test_engine) as session:
        yield session


@pytest.fixture(autouse=True)
def setup_test_database():
    """Automatically create all database tables before each test and drop them afterward."""
    SQLModel.metadata.create_all(bind=test_engine)
    app.dependency_overrides[get_session] = get_test_session

    yield

    SQLModel.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    """Provide a FastAPI TestClient instance for issuing HTTP requests to the application."""
    return TestClient(app)


def register_and_login(client: TestClient, is_admin: bool = False):
    """Register a user, grant admin rights if requested, login, and return authorization headers."""
    username = "Admin" if is_admin else "Bob"
    password = "123"

    client.post(
        "/api/authentication/register",
        json={"username": username, "password": password},
    )

    if is_admin:
        with Session(test_engine) as session:
            statement = select(User).where(User.username == username)
            user = session.exec(statement).first()
            if user:
                user.is_admin = True
                session.add(user)
                session.commit()

    response = client.post(
        "/api/authentication/login",
        json={"username": username, "password": password},
    )
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def authentication_headers(client):
    """Provide HTTP authorization headers for a standard non-admin user session."""
    return register_and_login(client, is_admin=False)


@pytest.fixture
def admin_authentication_headers(client):
    """Provide HTTP authorization headers for an authenticated admin user session."""
    return register_and_login(client, is_admin=True)


@pytest.fixture
def create_vehicle(client):
    """Return a helper function that sends a POST request to create a vehicle record."""

    def create(headers, quantity=5):
        """Send a request to create a vehicle with specified quantity and return the JSON response."""
        payload = {**VEHICLE_DATA, "quantity": quantity}
        response = client.post("/api/vehicles", headers=headers, json=payload)
        assert response.status_code == 201
        return response.json()

    return create
