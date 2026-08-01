import os
from collections.abc import Generator
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends
from sqlmodel import Session, create_engine

load_dotenv()

url = os.getenv("DATABASE_URL", "sqlite:///dealership.db")

arguments = {"check_same_thread": False} if url.startswith("sqlite") else {}
engine = create_engine(url, connect_args=arguments)


def get_session() -> Generator[Session, None, None]:
    """Provide a transactional database session for requests."""
    with Session(engine) as session:
        yield session


Database = Annotated[Session, Depends(get_session)]
