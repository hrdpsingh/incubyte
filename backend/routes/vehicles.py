from typing import Annotated

from database import Database
from fastapi import APIRouter, Depends, HTTPException, Query, status
from model import (
    RestockRequest,
    Vehicle,
    VehicleCreate,
    VehicleResponse,
    VehicleUpdate,
)
from sqlmodel import col, or_, select
from utilities.dependencies import get_admin_user, get_current_user, get_vehicle

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.post(
    "",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_admin_user)],
)
def create_vehicle(vehicle: VehicleCreate, database: Database):
    """Create a new vehicle record in the database."""

    database_vehicle = Vehicle.model_validate(vehicle)
    database.add(database_vehicle)
    database.commit()
    database.refresh(database_vehicle)
    return database_vehicle


@router.get(
    "",
    response_model=list[VehicleResponse],
    dependencies=[Depends(get_current_user)],
)
def list_vehicles(database: Database):
    """Retrieve all vehicles from the database."""

    statement = select(Vehicle)
    return database.exec(statement).all()


@router.get(
    "/search",
    response_model=list[VehicleResponse],
    dependencies=[Depends(get_current_user)],
)
def search_vehicles(
    database: Database,
    query: str | None = None,
    minimum_price: float | None = Query(None, ge=0, description="Minimum price filter"),
    maximum_price: float | None = Query(None, ge=0, description="Maximum price filter"),
):
    """Search and filter vehicles by keyword, minimum price, and maximum price."""

    statement = select(Vehicle)

    if query:
        pattern = f"%{query}%"
        statement = statement.where(
            or_(
                col(Vehicle.make).ilike(pattern),
                col(Vehicle.model).ilike(pattern),
                col(Vehicle.category).ilike(pattern),
            )
        )

    if minimum_price is not None:
        statement = statement.where(Vehicle.price >= minimum_price)

    if maximum_price is not None:
        statement = statement.where(Vehicle.price <= maximum_price)

    return database.exec(statement).all()


@router.put(
    "/{id}",
    response_model=VehicleResponse,
    dependencies=[Depends(get_admin_user)],
)
def update_vehicle(
    vehicle_update: VehicleUpdate,
    vehicle: Annotated[Vehicle, Depends(get_vehicle)],
    database: Database,
):
    """Update an existing vehicle's details by ID."""

    update_data = vehicle_update.model_dump(exclude_unset=True)
    vehicle.sqlmodel_update(update_data)

    database.add(vehicle)
    database.commit()
    database.refresh(vehicle)
    return vehicle


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_admin_user)],
)
def delete_vehicle(
    vehicle: Annotated[Vehicle, Depends(get_vehicle)],
    database: Database,
):
    """Delete a vehicle from the database by ID."""

    database.delete(vehicle)
    database.commit()


@router.post(
    "/{id}/purchase",
    response_model=VehicleResponse,
    tags=["inventory"],
    dependencies=[Depends(get_current_user)],
)
def purchase_vehicle(
    vehicle: Annotated[Vehicle, Depends(get_vehicle)],
    database: Database,
):
    """Decrement vehicle stock quantity by one upon purchase."""

    if vehicle.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is out of stock",
        )

    vehicle.quantity -= 1
    database.add(vehicle)
    database.commit()
    database.refresh(vehicle)
    return vehicle


@router.post(
    "/{id}/restock",
    response_model=VehicleResponse,
    tags=["inventory"],
    dependencies=[Depends(get_admin_user)],
)
def restock_vehicle(
    body: RestockRequest,
    vehicle: Annotated[Vehicle, Depends(get_vehicle)],
    database: Database,
):
    """Increase vehicle stock inventory by the specified quantity."""

    vehicle.quantity += body.quantity
    database.add(vehicle)
    database.commit()
    database.refresh(vehicle)
    return vehicle
