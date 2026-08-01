from typing import Annotated

import jwt
from database import Database
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from model import User, Vehicle
from sqlmodel import select
from utilities.security import ALGORITHM, SECRET_KEY

security_scheme = HTTPBearer()


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)],
    database: Database,
) -> User:
    """Authenticate the JWT bearer token and return the corresponding user from the database."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        username = payload.get("sub")
        if not username:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    statement = select(User).where(User.username == username)
    user = database.exec(statement).first()

    if user is None:
        raise credentials_exception

    return user


def get_admin_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Verify that the authenticated user has administrative privileges."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


def get_vehicle(id: int, database: Database) -> Vehicle:
    """Retrieve a vehicle by its ID or raise a 404 HTTP exception if not found."""
    vehicle = database.get(Vehicle, id)
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found",
        )
    return vehicle
