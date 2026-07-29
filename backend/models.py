from database import Base
from pydantic import BaseModel
from sqlalchemy.orm import Mapped, mapped_column


class User(Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(primary_key=True, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column()


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str
