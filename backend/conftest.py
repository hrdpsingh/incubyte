import pytest
from database import Base, LocalSession, get_database
from main import app
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

LocalSession.configure(bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    app.dependency_overrides[get_database] = lambda: LocalSession()

    Base.metadata.create_all(bind=test_engine)

    yield

    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def reset_database():
    yield
    with test_engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())
