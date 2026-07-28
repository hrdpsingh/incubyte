import os

import pytest
from database import Base, engine

DATABASE_URL = "sqlite:///./test_dealership.db"


@pytest.fixture(autouse=True)
def reset_database():
    yield
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_database():
    yield
    engine.dispose()
    if os.path.exists("test_dealership.db"):
        os.remove("test_dealership.db")
