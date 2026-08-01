import os

from database import engine
from model import User
from sqlmodel import Session, select
from utilities.security import hash_password


def create_admin() -> None:
    """Create a default admin user using environment credentials if not already present."""
    username = "Admin"
    password = os.getenv("ADMIN_PASSWORD")

    if not password:
        raise ValueError("ADMIN_PASSWORD environment variable is not set.")

    with Session(engine) as session:
        statement = select(User).where(User.username == username)
        existing = session.exec(statement).first()

        if existing:
            print(f"User '{username}' already exists.")
            return

        admin = User(
            username=username,
            password_hash=hash_password(password),
            is_admin=True,
        )
        session.add(admin)
        session.commit()
        print(f"Created admin user '{username}'.")
