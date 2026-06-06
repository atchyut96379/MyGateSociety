from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ResidentNotification, User
from ..schemas import NotificationResponse
from ..security import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = (
        db.query(ResidentNotification)
        .filter(ResidentNotification.user_id == current_user.id)
        .order_by(ResidentNotification.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        NotificationResponse(
            id=n.id,
            type=n.type,
            title=n.title,
            body=n.body,
            read=n.read,
            created_at=n.created_at.isoformat(),
        )
        for n in items
    ]


@router.post("/{notification_id}/read")
def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.get(ResidentNotification, notification_id)
    if item is None or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    item.read = True
    db.commit()
    return {"ok": True}
