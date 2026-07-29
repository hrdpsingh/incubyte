import hashlib
import secrets
from typing import Annotated

import bcrypt
from database import DatabaseSession
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from models import LoginRequest, RegisterRequest, User

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()


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
    database.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
    }


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


security = HTTPBearer()

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

    return user
