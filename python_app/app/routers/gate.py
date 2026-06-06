from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import DeliveryPass, DomesticStaff, KidExitRequest, StaffAttendance, User, VisitorPass
from ..schemas import DailyGateLogsResponse, GateLogEntry, GateLookupResponse
from ..security import require_roles

router = APIRouter(prefix="/gate", tags=["gate"])


def _day_bounds(day: datetime) -> tuple[datetime, datetime]:
    start = day.replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timedelta(days=1)


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


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


@router.get("/daily-logs", response_model=DailyGateLogsResponse)
def daily_gate_logs(
    date: str | None = Query(None, description="YYYY-MM-DD, defaults to today (UTC)"),
    _: User = Depends(require_roles("ADMIN", "COMMITTEE", "SECURITY")),
    db: Session = Depends(get_db),
):
    if date:
        try:
            day = datetime.strptime(date, "%Y-%m-%d")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="date must be YYYY-MM-DD") from exc
    else:
        day = datetime.utcnow()

    start, end = _day_bounds(day)

    visitors = (
        db.query(VisitorPass)
        .options(joinedload(VisitorPass.flat))
        .filter(VisitorPass.created_at >= start, VisitorPass.created_at < end)
        .order_by(VisitorPass.created_at.desc())
        .all()
    )
    visitor_logs = [
        GateLogEntry(
            type="visitor",
            id=v.id,
            name=v.guest_name,
            flat_label=v.flat.label if v.flat else None,
            check_in=_iso(v.checked_in_at),
            check_out=_iso(v.checked_out_at),
            status=v.status,
            detail=v.purpose,
        )
        for v in visitors
    ]

    staff_rows = (
        db.query(StaffAttendance)
        .options(joinedload(StaffAttendance.staff).joinedload(DomesticStaff.flat))
        .filter(StaffAttendance.date >= start, StaffAttendance.date < end)
        .order_by(StaffAttendance.check_in.desc())
        .all()
    )
    staff_logs = [
        GateLogEntry(
            type="staff",
            id=row.id,
            name=row.staff.name if row.staff else "—",
            flat_label=row.staff.flat.label if row.staff and row.staff.flat else None,
            check_in=_iso(row.check_in),
            check_out=_iso(row.check_out),
            status="INSIDE" if row.check_in and not row.check_out else "COMPLETED" if row.check_out else "PENDING",
            detail=row.staff.staff_type if row.staff else None,
        )
        for row in staff_rows
    ]

    deliveries = (
        db.query(DeliveryPass)
        .options(joinedload(DeliveryPass.flat))
        .filter(DeliveryPass.created_at >= start, DeliveryPass.created_at < end)
        .order_by(DeliveryPass.created_at.desc())
        .all()
    )
    delivery_logs = [
        GateLogEntry(
            type="delivery",
            id=d.id,
            name=d.company,
            flat_label=d.flat.label if d.flat else None,
            check_in=_iso(d.delivered_at),
            check_out=_iso(d.collected_at),
            status=d.status,
            detail=d.mode,
        )
        for d in deliveries
    ]

    return DailyGateLogsResponse(
        date=start.strftime("%Y-%m-%d"),
        visitors=visitor_logs,
        staff=staff_logs,
        deliveries=delivery_logs,
    )
