import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
from database import DatabaseSession
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from models import LoginRequest, RegisterRequest, User

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()

TOKEN_EXPIRE_MINUTES = 30


@router.post("/register", status_code=201)
def register(payload: RegisterRequest, database: DatabaseSession):
    existing = database.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
    )
    database.add(user)
    database.commit()
    database.refresh(user)

    return {"username": user.username}


@router.post("/login")
def login(payload: LoginRequest, database: DatabaseSession):
    user = database.query(User).filter(User.username == payload.username).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = secrets.token_hex(32)

    user.token_hash = hashlib.sha256(token.encode()).hexdigest()
    user.token_expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=TOKEN_EXPIRE_MINUTES
    )

    database.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_seconds": TOKEN_EXPIRE_MINUTES * 60,
    }


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


BearerCredentials = Annotated[
    HTTPAuthorizationCredentials,
    Depends(security),
]


def get_current_user(
    credentials: BearerCredentials,
    database: DatabaseSession,
):
    token_hash = hashlib.sha256(credentials.credentials.encode()).hexdigest()

    user = database.query(User).filter(User.token_hash == token_hash).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    now = datetime.now(timezone.utc)
    user_expiry = (
        user.token_expires_at.replace(tzinfo=timezone.utc)
        if user.token_expires_at and user.token_expires_at.tzinfo is None
        else user.token_expires_at
    )

    if user_expiry is None or now > user_expiry:
        raise HTTPException(
            status_code=401,
            detail="Token has expired. Please login again.",
        )

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_admin_user(current_user: CurrentUser) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


AdminUser = Annotated[User, Depends(get_admin_user)]
