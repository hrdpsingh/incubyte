import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import database
from main import app

test_engine = create_engine(
    os.environ["DATABASE_URL"],
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestLocalSession = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


def override_get_database():
    database = TestLocalSession()
    try:
        yield database
    finally:
        database.close()


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    app.dependency_overrides[database.get_database] = override_get_database
    database.Base.metadata.create_all(bind=test_engine)

    yield

    database.Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def reset_database():
    yield
    for table in reversed(database.Base.metadata.sorted_tables):
        with test_engine.begin() as connection:
            connection.execute(table.delete())
