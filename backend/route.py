import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
import jwt
from database import DatabaseSession
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from model import (
    LoginRequest,
    RegisterRequest,
    RestockRequest,
    User,
    UserResponse,
    Vehicle,
    VehicleCreate,
    VehicleResponse,
    VehicleUpdate,
)

router = APIRouter()
security = HTTPBearer()

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is missing!")

ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 30


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode({**data, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


BearerCredentials = Annotated[HTTPAuthorizationCredentials, Depends(security)]


def get_current_user(credentials: BearerCredentials, database: DatabaseSession) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM]
        )
        if not (username := payload.get("sub")):
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    if user := database.query(User).filter(User.username == username).first():
        return user

    raise credentials_exception


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_admin_user(current_user: CurrentUser) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


def get_vehicle(vehicle_id: int, database: DatabaseSession) -> Vehicle:
    if vehicle := database.get(Vehicle, vehicle_id):
        return vehicle
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
    )


VehicleDep = Annotated[Vehicle, Depends(get_vehicle)]


@router.post("/api/auth/register", status_code=status.HTTP_201_CREATED, tags=["auth"])
def register(payload: RegisterRequest, database: DatabaseSession):
    if database.query(User).filter(User.username == payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Username already exists"
        )

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
    )
    database.add(user)
    database.commit()

    return {"username": user.username}


@router.post("/api/auth/login", tags=["auth"])
def login(payload: LoginRequest, database: DatabaseSession):
    user = database.query(User).filter(User.username == payload.username).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    return {
        "access_token": create_access_token({"sub": user.username}),
        "token_type": "bearer",
        "expires_in_seconds": TOKEN_EXPIRE_MINUTES * 60,
    }


@router.post(
    "/api/users/{username}/promote",
    response_model=UserResponse,
    tags=["users"],
    dependencies=[Depends(get_admin_user)],
)
def promote_user(username: str, database: DatabaseSession):
    user = database.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user.is_admin = True
    database.commit()
    database.refresh(user)
    return user


@router.post(
    "/api/vehicles",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["vehicles"],
    dependencies=[Depends(get_current_user)],
)
def create_vehicle(vehicle: VehicleCreate, database: DatabaseSession):
    database_vehicle = Vehicle(**vehicle.model_dump())
    database.add(database_vehicle)
    database.commit()
    database.refresh(database_vehicle)
    return database_vehicle


@router.get(
    "/api/vehicles",
    response_model=list[VehicleResponse],
    tags=["vehicles"],
    dependencies=[Depends(get_current_user)],
)
def list_vehicles(database: DatabaseSession):
    return database.query(Vehicle).all()


@router.get(
    "/api/vehicles/search",
    response_model=list[VehicleResponse],
    tags=["vehicles"],
    dependencies=[Depends(get_current_user)],
)
def search_vehicles(
    database: DatabaseSession,
    make: str | None = None,
    model: str | None = None,
    category: str | None = None,
    min_price: float | None = Query(None, ge=0, description="Minimum price filter"),
    max_price: float | None = Query(None, ge=0, description="Maximum price filter"),
):
    filters = []
    if make:
        filters.append(Vehicle.make.ilike(f"%{make}%"))
    if model:
        filters.append(Vehicle.model.ilike(f"%{model}%"))
    if category:
        filters.append(Vehicle.category.ilike(f"%{category}%"))
    if min_price is not None:
        filters.append(Vehicle.price >= min_price)
    if max_price is not None:
        filters.append(Vehicle.price <= max_price)

    return database.query(Vehicle).filter(*filters).all()


@router.put(
    "/api/vehicles/{vehicle_id}",
    response_model=VehicleResponse,
    tags=["vehicles"],
    dependencies=[Depends(get_current_user)],
)
def update_vehicle(
    vehicle_update: VehicleUpdate,
    vehicle: VehicleDep,
    database: DatabaseSession,
):
    for key, value in vehicle_update.model_dump(exclude_unset=True).items():
        setattr(vehicle, key, value)

    database.commit()
    database.refresh(vehicle)
    return vehicle


@router.delete(
    "/api/vehicles/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["vehicles"],
    dependencies=[Depends(get_admin_user)],
)
def delete_vehicle(vehicle: VehicleDep, database: DatabaseSession):
    database.delete(vehicle)
    database.commit()


@router.post(
    "/api/inventory/{vehicle_id}/purchase",
    response_model=VehicleResponse,
    tags=["inventory"],
    dependencies=[Depends(get_current_user)],
)
def purchase_vehicle(vehicle: VehicleDep, database: DatabaseSession):
    if vehicle.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is out of stock",
        )

    vehicle.quantity -= 1
    database.commit()
    database.refresh(vehicle)
    return vehicle


@router.post(
    "/api/inventory/{vehicle_id}/restock",
    response_model=VehicleResponse,
    tags=["inventory"],
    dependencies=[Depends(get_admin_user)],
)
def restock_vehicle(
    body: RestockRequest,
    vehicle: VehicleDep,
    database: DatabaseSession,
):
    vehicle.quantity += body.quantity
    database.commit()
    database.refresh(vehicle)
    return vehicle
