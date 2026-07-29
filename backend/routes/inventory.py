from database import DatabaseSession
from fastapi import APIRouter, Depends, HTTPException
from models import Vehicle
from routes.authentication import get_current_user

router = APIRouter(
    prefix="/api/inventory",
    tags=["inventory"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/{vehicle_id}/purchase")
def purchase_vehicle(vehicle_id: int, database: DatabaseSession):
    database_vehicle = database.get(Vehicle, vehicle_id)

    if database_vehicle is None:
        raise HTTPException(status_code=404)

    if database_vehicle.quantity != 0:
        database_vehicle.quantity -= 1

    database.commit()
    database.refresh(database_vehicle)

    return database_vehicle


@router.post("/{vehicle_id}/restock")
def restock_vehicle(vehicle_id: int, body: dict, database: DatabaseSession):
    database_vehicle = database.get(Vehicle, vehicle_id)

    if database_vehicle is None:
        raise HTTPException(status_code=404)

    database_vehicle.quantity += body["quantity"]

    database.commit()
    database.refresh(database_vehicle)

    return database_vehicle
