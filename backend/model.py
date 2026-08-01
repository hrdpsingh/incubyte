from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    """Database model representing a user account in the system."""

    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)
    username: str
    password_hash: str
    is_admin: bool = False


class VehicleBase(SQLModel):
    """Base model defining core vehicle properties shared across schemas."""

    make: str
    model: str
    category: str
    price: float
    quantity: int


class Vehicle(VehicleBase, table=True):
    """Database model representing a vehicle record in the inventory."""

    __tablename__ = "vehicles"

    id: int | None = Field(default=None, primary_key=True)


class VehicleCreate(VehicleBase):
    """Schema for creating a new vehicle record."""


class VehicleUpdate(SQLModel):
    """Schema for updating vehicle details with all optional fields."""

    make: str | None = None
    model: str | None = None
    category: str | None = None
    price: float | None = None
    quantity: int | None = None


class VehicleResponse(VehicleBase):
    """Schema for returning full vehicle information including its ID."""

    id: int


class AuthenticationRequest(SQLModel):
    """Schema for user login credentials payload."""

    username: str
    password: str


class RestockRequest(SQLModel):
    """Schema for inventory restock requests with quantity validation."""

    quantity: int = Field(gt=0)
