from database import DatabaseSession
from fastapi import APIRouter, Depends, HTTPException, status
from models import RestockRequest, Vehicle, VehicleResponse
from routes.authentication import get_current_user

router = APIRouter(
    prefix="/api/inventory",
    tags=["inventory"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/{vehicle_id}/purchase", response_model=VehicleResponse)
def purchase_vehicle(vehicle_id: int, database: DatabaseSession):
    database_vehicle = database.get(Vehicle, vehicle_id)

    if database_vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )

    if database_vehicle.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vehicle is out of stock",
        )

    database_vehicle.quantity -= 1

    database.commit()
    database.refresh(database_vehicle)

    return database_vehicle


@router.post("/{vehicle_id}/restock", response_model=VehicleResponse)
def restock_vehicle(
    vehicle_id: int,
    body: RestockRequest,
    database: DatabaseSession,
):
    database_vehicle = database.get(Vehicle, vehicle_id)

    if database_vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )

    database_vehicle.quantity += body.quantity

    database.commit()
    database.refresh(database_vehicle)

    return database_vehicle
