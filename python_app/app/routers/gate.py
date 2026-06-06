from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DeliveryPass, DomesticStaff, KidExitRequest, User, VisitorPass
from ..schemas import GateLookupResponse
from ..security import require_roles

router = APIRouter(prefix="/gate", tags=["gate"])


@router.get("/lookup", response_model=GateLookupResponse)
def lookup_otp(
    otp: str = Query(..., min_length=4, max_length=20),
    _: User = Depends(require_roles("SECURITY", "ADMIN")),
    db: Session = Depends(get_db),
):
    code = otp.strip()

    visitor = (
        db.query(VisitorPass)
        .filter(
            VisitorPass.otp == code,
            VisitorPass.status.in_(["PENDING", "APPROVED", "CHECKED_IN"]),
        )
        .first()
    )
    if visitor:
        return GateLookupResponse(
            type="visitor",
            record={
                "id": visitor.id,
                "guest_name": visitor.guest_name,
                "flat_label": visitor.flat.label if visitor.flat else None,
                "status": visitor.status,
                "otp": visitor.otp,
            },
        )

    delivery = (
        db.query(DeliveryPass)
        .filter(
            DeliveryPass.otp == code,
            DeliveryPass.status.in_(["PENDING", "DELIVERED", "AT_GATE", "LEFT_AT_GATE"]),
        )
        .first()
    )
    if delivery:
        return GateLookupResponse(
            type="delivery",
            record={
                "id": delivery.id,
                "company": delivery.company,
                "flat_label": delivery.flat.label if delivery.flat else None,
                "status": delivery.status,
                "mode": delivery.mode,
                "otp": delivery.otp,
            },
        )

    staff = db.query(DomesticStaff).filter(DomesticStaff.passcode == code, DomesticStaff.active).first()
    if staff:
        return GateLookupResponse(
            type="staff",
            record={
                "id": staff.id,
                "name": staff.name,
                "staff_type": staff.staff_type,
                "flat_label": staff.flat.label if staff.flat else None,
                "passcode": staff.passcode,
            },
        )

    kid = (
        db.query(KidExitRequest)
        .filter(KidExitRequest.otp == code, KidExitRequest.status == "APPROVED")
        .first()
    )
    if kid:
        return GateLookupResponse(
            type="kid",
            record={
                "id": kid.id,
                "child_name": kid.child_name,
                "flat_label": kid.flat.label if kid.flat else None,
                "parent_name": kid.parent.name if kid.parent else None,
            },
        )

    raise HTTPException(status_code=404, detail="No active pass for this code")
