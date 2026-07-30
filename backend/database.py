import os
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

load_dotenv()

url = os.getenv("DATABASE_URL", "sqlite:///dealership.db")

engine = create_engine(
    url,
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
