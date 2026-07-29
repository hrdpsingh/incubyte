from database import DatabaseSession
from fastapi import APIRouter, HTTPException, Response, status
from models import Vehicle

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])


@router.post("", status_code=status.HTTP_201_CREATED)
def create_vehicle(vehicle: dict, db: DatabaseSession):
    db_vehicle = Vehicle(**vehicle)
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


@router.get("")
def list_vehicles(db: DatabaseSession):
    return db.query(Vehicle).all()


@router.get("/search")
def search_vehicles(
    db: DatabaseSession,
    make: str | None = None,
):
    query = db.query(Vehicle)

    if make:
        query = query.filter(Vehicle.make == make)

    return query.all()


@router.put("/{vehicle_id}")
def update_vehicle(vehicle_id: int, vehicle: dict, db: DatabaseSession):
    db_vehicle = db.get(Vehicle, vehicle_id)

    if db_vehicle is None:
        raise HTTPException(status_code=404)

    for key, value in vehicle.items():
        setattr(db_vehicle, key, value)

    db.commit()
    db.refresh(db_vehicle)

    return db_vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(vehicle_id: int, db: DatabaseSession):
    db_vehicle = db.get(Vehicle, vehicle_id)

    if db_vehicle is None:
        raise HTTPException(status_code=404)

    db.delete(db_vehicle)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{vehicle_id}/purchase")
def purchase_vehicle(vehicle_id: int, db: DatabaseSession):
    db_vehicle = db.get(Vehicle, vehicle_id)

    if db_vehicle is None:
        raise HTTPException(status_code=404)

    db_vehicle.quantity -= 1

    db.commit()
    db.refresh(db_vehicle)

    return db_vehicle


@router.post("/{vehicle_id}/restock")
def restock_vehicle(vehicle_id: int, body: dict, db: DatabaseSession):
    db_vehicle = db.get(Vehicle, vehicle_id)

    if db_vehicle is None:
        raise HTTPException(status_code=404)

    db_vehicle.quantity += body["quantity"]

    db.commit()
    db.refresh(db_vehicle)

    return db_vehicle
