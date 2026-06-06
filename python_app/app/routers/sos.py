from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SosAlert, User
from ..schemas import CreateSosRequest, SosResponse
from ..security import get_current_user, require_roles
from ..utils import new_id

router = APIRouter(prefix="/sos", tags=["sos"])


def sos_response(alert: SosAlert) -> SosResponse:
    return SosResponse(
        id=alert.id,
        message=alert.message,
        status=alert.status,
        flat_label=alert.flat_label,
        user_name=alert.user.name if alert.user else None,
        user_phone=alert.user.phone if alert.user else None,
        created_at=alert.created_at.isoformat(),
    )


@router.get("", response_model=list[SosResponse])
def list_active_sos(
    _: User = Depends(require_roles("SECURITY", "ADMIN")),
    db: Session = Depends(get_db),
):
    alerts = (
        db.query(SosAlert)
        .filter(SosAlert.status.in_(["ACTIVE", "ACKNOWLEDGED"]))
        .order_by(SosAlert.created_at.desc())
        .limit(20)
        .all()
    )
    return [sos_response(a) for a in alerts]


@router.post("", response_model=SosResponse, status_code=status.HTTP_201_CREATED)
def raise_sos(
    payload: CreateSosRequest,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    flat_label = current_user.flat.label if current_user.flat else "Unknown"
    alert = SosAlert(
        id=new_id(),
        message=payload.message,
        user_id=current_user.id,
        flat_label=flat_label,
    )
    db.add(alert)
    from ..notify import notify_society_admins

    notify_society_admins(
        db,
        current_user.society_id,
        type="SOS",
        title="SOS alert",
        body=f"Flat {flat_label}: {payload.message or 'Emergency help needed'}",
        dedupe_key=f"sos:{alert.id}",
    )
    db.commit()
    db.refresh(alert)
    return sos_response(alert)


@router.post("/{alert_id}/resolve", response_model=SosResponse)
def resolve_sos(
    alert_id: str,
    _: User = Depends(require_roles("SECURITY", "ADMIN")),
    db: Session = Depends(get_db),
):
    alert = db.get(SosAlert, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Not found")
    alert.status = "RESOLVED"
    alert.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return sos_response(alert)
