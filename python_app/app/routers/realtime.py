from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Complaint,
    DeliveryPass,
    Flat,
    KidExitRequest,
    MaintenanceBill,
    MoveRequest,
    ResidentNotification,
    SosAlert,
    User,
    VisitorPass,
)
from ..schemas import RealtimeSummaryResponse
from ..security import get_current_user

router = APIRouter(prefix="/realtime", tags=["realtime"])


@router.get("/summary", response_model=RealtimeSummaryResponse)
def realtime_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    unread = (
        db.query(func.count(ResidentNotification.id))
        .filter(
            ResidentNotification.user_id == current_user.id,
            ResidentNotification.read == False,  # noqa: E712 — SQL Server rejects `IS 0`
        )
        .scalar()
        or 0
    )

    pending_deliveries = 0
    pending_bills = 0
    open_complaints = 0
    pending_kids_exit = 0
    active_sos = 0
    pending_moves = 0
    visitors_today = 0

    if current_user.flat_id:
        pending_bills = (
            db.query(func.count(MaintenanceBill.id))
            .filter(
                MaintenanceBill.flat_id == current_user.flat_id,
                MaintenanceBill.status == "UNPAID",
            )
            .scalar()
            or 0
        )

    if current_user.role == "RESIDENT" and current_user.flat_id:
        pending_deliveries = (
            db.query(func.count(DeliveryPass.id))
            .filter(
                DeliveryPass.flat_id == current_user.flat_id,
                DeliveryPass.status == "PENDING",
            )
            .scalar()
            or 0
        )
        open_complaints = (
            db.query(func.count(Complaint.id))
            .filter(
                Complaint.flat_id == current_user.flat_id,
                Complaint.status.in_(["OPEN", "IN_PROGRESS"]),
            )
            .scalar()
            or 0
        )
        pending_kids_exit = (
            db.query(func.count(KidExitRequest.id))
            .filter(
                KidExitRequest.flat_id == current_user.flat_id,
                KidExitRequest.status == "PENDING",
            )
            .scalar()
            or 0
        )

    if current_user.role in {"SECURITY", "ADMIN", "COMMITTEE"}:
        active_sos = (
            db.query(func.count(SosAlert.id))
            .filter(SosAlert.status == "ACTIVE")
            .scalar()
            or 0
        )
        today = datetime.utcnow().date()
        visitors_today = (
            db.query(func.count(VisitorPass.id))
            .join(Flat, VisitorPass.flat_id == Flat.id)
            .filter(
                Flat.society_id == current_user.society_id,
                VisitorPass.created_at >= datetime.combine(today, datetime.min.time()),
            )
            .scalar()
            or 0
        )

    if current_user.role in {"ADMIN", "COMMITTEE"}:
        open_complaints = (
            db.query(func.count(Complaint.id))
            .join(User, Complaint.user_id == User.id)
            .filter(
                User.society_id == current_user.society_id,
                Complaint.status.in_(["OPEN", "IN_PROGRESS"]),
            )
            .scalar()
            or 0
        )
        pending_moves = (
            db.query(func.count(MoveRequest.id))
            .join(User, MoveRequest.user_id == User.id)
            .filter(
                User.society_id == current_user.society_id,
                MoveRequest.status == "PENDING",
            )
            .scalar()
            or 0
        )

    return RealtimeSummaryResponse(
        unread_notifications=int(unread),
        pending_deliveries=int(pending_deliveries),
        pending_bills=int(pending_bills),
        open_complaints=int(open_complaints),
        pending_kids_exit=int(pending_kids_exit),
        active_sos=int(active_sos),
        pending_moves=int(pending_moves),
        visitors_today=int(visitors_today),
        server_time=datetime.utcnow().isoformat(),
    )
