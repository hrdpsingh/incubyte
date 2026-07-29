from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
import jwt
from database import DatabaseSession
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from models import LoginRequest, RegisterRequest, User

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()

SECRET_KEY = "your-fallback-secret-key-change-this-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 30


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


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

    access_token = create_access_token(data={"sub": user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in_seconds": TOKEN_EXPIRE_MINUTES * 60,
    }


BearerCredentials = Annotated[
    HTTPAuthorizationCredentials,
    Depends(security),
]


def get_current_user(
    credentials: BearerCredentials,
    database: DatabaseSession,
) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    # Retrieve user from DB to ensure they still exist
    user = database.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception

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
