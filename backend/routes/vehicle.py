from database import DatabaseSession
from fastapi import APIRouter, Depends, HTTPException, Response, status
from models import Vehicle, VehicleCreate, VehicleResponse, VehicleUpdate
from routes.authentication import get_current_user

router = APIRouter(
    prefix="/api/vehicles",
    tags=["vehicles"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(vehicle: VehicleCreate, database: DatabaseSession):
    database_vehicle = Vehicle(**vehicle.model_dump())
    database.add(database_vehicle)
    database.commit()
    database.refresh(database_vehicle)
    return database_vehicle


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(database: DatabaseSession):
    return database.query(Vehicle).all()


@router.get("/search", response_model=list[VehicleResponse])
def search_vehicles(
    database: DatabaseSession,
    make: str | None = None,
):
    query = database.query(Vehicle)

    if make:
        query = query.filter(Vehicle.make == make)

    return query.all()


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: int, vehicle: VehicleUpdate, database: DatabaseSession):
    database_vehicle = database.get(Vehicle, vehicle_id)

    if database_vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )

    update_data = vehicle.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(database_vehicle, key, value)

    database.commit()
    database.refresh(database_vehicle)

    return database_vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, database: DatabaseSession):
    database_vehicle = database.get(Vehicle, vehicle_id)

    if database_vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found"
        )

    database.delete(database_vehicle)
    database.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
