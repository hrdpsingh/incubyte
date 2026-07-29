from typing import Annotated

from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

engine = create_engine(
    "sqlite:///./dealership.db",
    connect_args={"check_same_thread": False},
)

LocalSession = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_database():
    database = LocalSession()
    try:
        yield database
    finally:
        database.close()


DatabaseSession = Annotated[Session, Depends(get_database)]
