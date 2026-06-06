from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, VisitorPass
from ..schemas import CreateVisitorRequest, VisitorResponse
from ..security import get_current_user, require_roles
from ..utils import generate_otp, new_id

router = APIRouter(prefix="/visitors", tags=["visitors"])


def visitor_response(visitor: VisitorPass) -> VisitorResponse:
    return VisitorResponse(
        id=visitor.id,
        guest_name=visitor.guest_name,
        guest_phone=visitor.guest_phone,
        purpose=visitor.purpose,
        vehicle_no=visitor.vehicle_no,
        guest_type=visitor.guest_type,
        visit_date=visitor.visit_date.isoformat(),
        valid_from=visitor.valid_from.isoformat(),
        valid_until=visitor.valid_until.isoformat(),
        otp=visitor.otp,
        status=visitor.status,
        flat_id=visitor.flat_id,
        flat_label=visitor.flat.label if visitor.flat else None,
        created_by_name=visitor.created_by.name if visitor.created_by else None,
    )


@router.get("", response_model=list[VisitorResponse])
def list_visitors(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(VisitorPass)

    if current_user.role == "RESIDENT":
        if not current_user.flat_id:
            return []
        query = query.filter(VisitorPass.flat_id == current_user.flat_id)
    elif current_user.role == "SECURITY":
        query = query.filter(VisitorPass.status.in_(["PENDING", "APPROVED", "CHECKED_IN"]))

    visitors = query.order_by(VisitorPass.created_at.desc()).limit(50).all()
    return [visitor_response(visitor) for visitor in visitors]


@router.post("", response_model=VisitorResponse, status_code=status.HTTP_201_CREATED)
def create_visitor(
    payload: CreateVisitorRequest,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    if not current_user.flat_id:
        raise HTTPException(status_code=403, detail="Resident flat required")

    visitor = VisitorPass(
        id=new_id(),
        guest_name=payload.guest_name,
        guest_phone=payload.guest_phone,
        purpose=payload.purpose,
        vehicle_no=payload.vehicle_no,
        visit_date=datetime.fromisoformat(payload.visit_date.replace("Z", "+00:00")),
        valid_from=datetime.fromisoformat(payload.valid_from.replace("Z", "+00:00")),
        valid_until=datetime.fromisoformat(payload.valid_until.replace("Z", "+00:00")),
        guest_type=payload.guest_type or "GUEST",
        otp=generate_otp(),
        status="APPROVED",
        flat_id=current_user.flat_id,
        created_by_id=current_user.id,
    )
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    return visitor_response(visitor)


@router.post("/{visitor_id}/check-in", response_model=VisitorResponse)
def check_in_visitor(
    visitor_id: str,
    _: User = Depends(require_roles("SECURITY", "ADMIN")),
    db: Session = Depends(get_db),
):
    visitor = db.get(VisitorPass, visitor_id)
    if visitor is None:
        raise HTTPException(status_code=404, detail="Not found")
    visitor.status = "CHECKED_IN"
    visitor.checked_in_at = datetime.utcnow()
    from ..notify import notify_flat_residents

    notify_flat_residents(
        db,
        visitor.flat_id,
        type="VISITOR",
        title="Visitor at gate",
        body=f"{visitor.guest_name} checked in with OTP {visitor.otp}.",
        dedupe_key=f"visitor-in:{visitor.id}",
    )
    db.commit()
    db.refresh(visitor)
    return visitor_response(visitor)


@router.post("/{visitor_id}/check-out", response_model=VisitorResponse)
def check_out_visitor(
    visitor_id: str,
    _: User = Depends(require_roles("SECURITY", "ADMIN")),
    db: Session = Depends(get_db),
):
    visitor = db.get(VisitorPass, visitor_id)
    if visitor is None:
        raise HTTPException(status_code=404, detail="Not found")
    visitor.status = "CHECKED_OUT"
    visitor.checked_out_at = datetime.utcnow()
    db.commit()
    db.refresh(visitor)
    return visitor_response(visitor)
