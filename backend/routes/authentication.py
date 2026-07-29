import hashlib
import secrets

from database import DatabaseSession
from fastapi import APIRouter, HTTPException
from models import LoginRequest, RegisterRequest, User

router = APIRouter(prefix="/api/auth", tags=["auth"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


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

    if not user or user.password_hash != hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = secrets.token_hex()
    return {"access_token": token, "token_type": "bearer"}
