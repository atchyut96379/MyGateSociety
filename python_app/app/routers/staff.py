from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import DomesticStaff, StaffAttendance, User
from ..models import StaffRating
from ..schemas import CreateStaffRequest, RateStaffRequest, StaffAttendanceEntry, StaffResponse
from ..security import get_current_user, require_roles
from ..utils import generate_otp, new_id

router = APIRouter(prefix="/staff", tags=["staff"])


def staff_response(staff: DomesticStaff) -> StaffResponse:
    return StaffResponse(
        id=staff.id,
        name=staff.name,
        phone=staff.phone,
        staff_type=staff.staff_type,
        passcode=staff.passcode,
        active=staff.active,
        flat_id=staff.flat_id,
        flat_label=staff.flat.label if staff.flat else None,
    )


@router.get("", response_model=list[StaffResponse])
def list_staff(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(DomesticStaff)
    if current_user.role == "RESIDENT":
        if not current_user.flat_id:
            return []
        query = query.filter(DomesticStaff.flat_id == current_user.flat_id)
    else:
        query = query.filter(DomesticStaff.active == True)  # noqa: E712 — SQL Server bit column

    items = query.order_by(DomesticStaff.created_at.desc()).limit(50).all()
    return [staff_response(s) for s in items]


@router.post("", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
def create_staff(
    payload: CreateStaffRequest,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    if not current_user.flat_id:
        raise HTTPException(status_code=403, detail="Flat required")

    passcode = generate_otp()
    for _ in range(5):
        if not db.query(DomesticStaff).filter(DomesticStaff.passcode == passcode).first():
            break
        passcode = generate_otp()

    staff = DomesticStaff(
        id=new_id(),
        name=payload.name,
        phone=payload.phone,
        staff_type=payload.staff_type,
        id_proof=payload.id_proof,
        flat_id=current_user.flat_id,
        created_by_id=current_user.id,
        passcode=passcode,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff_response(staff)


@router.post("/{staff_id}/check-in")
def staff_check_in(
    staff_id: str,
    _: User = Depends(require_roles("SECURITY", "ADMIN")),
    db: Session = Depends(get_db),
):
    staff = db.get(DomesticStaff, staff_id)
    if staff is None or not staff.active:
        raise HTTPException(status_code=404, detail="Staff not found")

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    existing = (
        db.query(StaffAttendance)
        .filter(StaffAttendance.staff_id == staff_id, StaffAttendance.date >= today)
        .first()
    )
    if existing and existing.check_in:
        return {"ok": True, "message": "Already checked in today"}

    if existing:
        existing.check_in = datetime.utcnow()
        existing.verified_by = "GUARD"
    else:
        db.add(
            StaffAttendance(
                id=new_id(),
                staff_id=staff_id,
                date=today,
                check_in=datetime.utcnow(),
                verified_by="GUARD",
            )
        )
    db.commit()
    return {"ok": True, "message": "Checked in", "staff_name": staff.name}


@router.post("/{staff_id}/check-out")
def staff_check_out(
    staff_id: str,
    _: User = Depends(require_roles("SECURITY", "ADMIN")),
    db: Session = Depends(get_db),
):
    staff = db.get(DomesticStaff, staff_id)
    if staff is None or not staff.active:
        raise HTTPException(status_code=404, detail="Staff not found")

    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    record = (
        db.query(StaffAttendance)
        .filter(StaffAttendance.staff_id == staff_id, StaffAttendance.date >= today)
        .first()
    )
    if record is None or not record.check_in:
        raise HTTPException(status_code=400, detail="Staff not checked in today")
    if record.check_out:
        return {"ok": True, "message": "Already checked out today"}

    record.check_out = datetime.utcnow()
    db.commit()
    return {"ok": True, "message": "Checked out", "staff_name": staff.name}


@router.get("/attendance/today", response_model=list[StaffAttendanceEntry])
def staff_attendance_today(
    _: User = Depends(require_roles("SECURITY", "ADMIN", "COMMITTEE")),
    db: Session = Depends(get_db),
):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    rows = (
        db.query(StaffAttendance)
        .options(joinedload(StaffAttendance.staff).joinedload(DomesticStaff.flat))
        .filter(StaffAttendance.date >= today)
        .order_by(StaffAttendance.check_in.desc())
        .all()
    )
    return [
        StaffAttendanceEntry(
            id=row.id,
            staff_id=row.staff.id,
            staff_name=row.staff.name,
            staff_type=row.staff.staff_type,
            flat_label=row.staff.flat.label if row.staff.flat else None,
            check_in=row.check_in.isoformat() if row.check_in else None,
            check_out=row.check_out.isoformat() if row.check_out else None,
        )
        for row in rows
        if row.staff is not None
    ]


@router.post("/rate")
def rate_staff(
    payload: RateStaffRequest,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    existing = (
        db.query(StaffRating)
        .filter(StaffRating.staff_id == payload.staff_id, StaffRating.user_id == current_user.id)
        .first()
    )
    if existing:
        existing.rating = payload.rating
        existing.review = payload.review
    else:
        db.add(
            StaffRating(
                id=new_id(),
                staff_id=payload.staff_id,
                user_id=current_user.id,
                rating=payload.rating,
                review=payload.review,
            )
        )
    db.commit()
    return {"ok": True}
