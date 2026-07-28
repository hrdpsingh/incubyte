import hashlib
import secrets

from database import DbSession
from fastapi import APIRouter, HTTPException
from models import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/register", status_code=201)
def register(payload: RegisterRequest, database: DbSession):
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

    return {"id": user.id, "username": user.username}


@router.post("/login")
def login(payload: LoginRequest, database: DbSession):
    user = database.query(User).filter(User.username == payload.username).first()

    if not user or user.password_hash != hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = secrets.token_hex(16)
    return {"access_token": token, "token_type": "bearer"}
