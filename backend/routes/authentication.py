from database import Database
from fastapi import APIRouter, HTTPException, status
from model import AuthenticationRequest, User
from sqlmodel import select
from utilities.security import (
    TOKEN_EXPIRATION_SECONDS,
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/authentication", tags=["authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: AuthenticationRequest, database: Database):
    """Register a new user after verifying the username is unique."""

    statement = select(User).where(User.username == payload.username)
    existing_user = database.exec(statement).first()

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username already exists"
        )

    new_user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
    )
    database.add(new_user)
    database.commit()

    return {"username": new_user.username}


@router.post("/login")
def login(payload: AuthenticationRequest, database: Database):
    """Authenticate user credentials and issue a JWT access token."""

    statement = select(User).where(User.username == payload.username)
    user = database.exec(statement).first()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    access_token = create_access_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in_seconds": TOKEN_EXPIRATION_SECONDS,
        "is_admin": user.is_admin,
    }
