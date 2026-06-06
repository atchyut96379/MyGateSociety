from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Amenity, AmenityBooking, User
from ..schemas import AmenityResponse, BookingResponse, CreateAmenityRequest, CreateBookingRequest
from ..security import get_current_user, require_roles
from ..utils import new_id

router = APIRouter(prefix="/amenities", tags=["amenities"])


@router.get("", response_model=list[AmenityResponse])
def list_amenities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = (
        db.query(Amenity)
        .filter(Amenity.society_id == current_user.society_id)
        .order_by(Amenity.name.asc())
        .all()
    )
    return [
        AmenityResponse(
            id=a.id,
            name=a.name,
            description=a.description,
            open_time=a.open_time,
            close_time=a.close_time,
        )
        for a in items
    ]


@router.post("", response_model=AmenityResponse, status_code=status.HTTP_201_CREATED)
def create_amenity(
    payload: CreateAmenityRequest,
    admin: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
):
    amenity = Amenity(
        id=new_id(),
        name=payload.name,
        description=payload.description,
        open_time=payload.open_time,
        close_time=payload.close_time,
        society_id=admin.society_id,
    )
    db.add(amenity)
    db.commit()
    db.refresh(amenity)
    return AmenityResponse(
        id=amenity.id,
        name=amenity.name,
        description=amenity.description,
        open_time=amenity.open_time,
        close_time=amenity.close_time,
    )


@router.get("/bookings", response_model=list[BookingResponse])
def list_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(AmenityBooking)
    if current_user.role == "RESIDENT":
        if not current_user.flat_id:
            return []
        query = query.filter(AmenityBooking.flat_id == current_user.flat_id)

    bookings = query.order_by(AmenityBooking.slot_start.desc()).limit(50).all()
    return [
        BookingResponse(
            id=b.id,
            amenity_name=b.amenity.name if b.amenity else None,
            flat_label=b.flat.label if b.flat else None,
            slot_start=b.slot_start.isoformat(),
            slot_end=b.slot_end.isoformat(),
            status=b.status,
            notes=b.notes,
        )
        for b in bookings
    ]


@router.post("/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: CreateBookingRequest,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    if not current_user.flat_id:
        raise HTTPException(status_code=403, detail="Flat required")

    booking = AmenityBooking(
        id=new_id(),
        amenity_id=payload.amenity_id,
        flat_id=current_user.flat_id,
        user_id=current_user.id,
        slot_start=datetime.fromisoformat(payload.slot_start.replace("Z", "+00:00")),
        slot_end=datetime.fromisoformat(payload.slot_end.replace("Z", "+00:00")),
        notes=payload.notes,
        status="PENDING",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return BookingResponse(
        id=booking.id,
        amenity_name=booking.amenity.name if booking.amenity else None,
        flat_label=booking.flat.label if booking.flat else None,
        slot_start=booking.slot_start.isoformat(),
        slot_end=booking.slot_end.isoformat(),
        status=booking.status,
        notes=booking.notes,
    )
