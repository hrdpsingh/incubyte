from datetime import datetime

from database import Base
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Boolean, DateTime, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column


class User(Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(primary_key=True, unique=True, index=True)
    password_hash: Mapped[str]
    token_hash: Mapped[str | None] = mapped_column(nullable=True)
    token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    make: Mapped[str]
    model: Mapped[str]
    category: Mapped[str]
    price: Mapped[float] = mapped_column(Float)
    quantity: Mapped[int] = mapped_column(Integer)


class VehicleCreate(BaseModel):
    make: str
    model: str
    category: str
    price: float
    quantity: int


class VehicleUpdate(BaseModel):
    make: str | None = None
    model: str | None = None
    category: str | None = None
    price: float | None = None
    quantity: int | None = None


class VehicleResponse(BaseModel):
    id: int
    make: str
    model: str
    category: str
    price: float
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class RestockRequest(BaseModel):
    quantity: int = Field(gt=0, description="Quantity to add to inventory")
