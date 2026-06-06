from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Vehicle
from ..schemas import CreateVehicleRequest, VehicleResponse
from ..security import get_current_user, require_roles
from ..utils import new_id

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


def vehicle_response(vehicle: Vehicle, db: Session) -> VehicleResponse:
    owner_name = None
    owner_phone = None
    if vehicle.flat:
        resident = (
            db.query(User)
            .filter(User.flat_id == vehicle.flat_id, User.role == "RESIDENT")
            .first()
        )
        if resident:
            owner_name = resident.name
            owner_phone = resident.phone

    return VehicleResponse(
        id=vehicle.id,
        number=vehicle.number,
        type=vehicle.type,
        color=vehicle.color,
        sticker_no=vehicle.sticker_no,
        flat_id=vehicle.flat_id,
        flat_label=vehicle.flat.label if vehicle.flat else None,
        owner_name=owner_name,
        owner_phone=owner_phone,
    )


@router.get("", response_model=list[VehicleResponse])
def list_vehicles(
    last4: str | None = Query(None, min_length=4, max_length=4),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if last4 and current_user.role in {"SECURITY", "ADMIN"}:
        all_vehicles = db.query(Vehicle).all()
        matched = [
            v for v in all_vehicles if v.number.replace(" ", "")[-4:] == last4
        ]
        return [vehicle_response(v, db) for v in matched]

    query = db.query(Vehicle)
    if current_user.role == "RESIDENT":
        if not current_user.flat_id:
            return []
        query = query.filter(Vehicle.flat_id == current_user.flat_id)

    vehicles = query.order_by(Vehicle.created_at.desc()).limit(50).all()
    return [vehicle_response(v, db) for v in vehicles]


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: CreateVehicleRequest,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    if not current_user.flat_id:
        raise HTTPException(status_code=403, detail="Flat required")

    vehicle = Vehicle(
        id=new_id(),
        number=payload.number.strip().upper(),
        type=payload.type or "Car",
        color=payload.color,
        sticker_no=payload.sticker_no,
        flat_id=current_user.flat_id,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle_response(vehicle, db)
