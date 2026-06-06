from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Event, User
from ..schemas import CreateEventRequest, EventResponse
from ..security import get_current_user, require_roles
from ..utils import new_id

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventResponse])
def list_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    events = (
        db.query(Event)
        .filter(Event.society_id == current_user.society_id)
        .order_by(Event.starts_at.asc())
        .limit(30)
        .all()
    )
    return [
        EventResponse(
            id=e.id,
            title=e.title,
            body=e.body,
            location=e.location,
            starts_at=e.starts_at.isoformat(),
            ends_at=e.ends_at.isoformat() if e.ends_at else None,
        )
        for e in events
    ]


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: CreateEventRequest,
    admin: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
):
    event = Event(
        id=new_id(),
        title=payload.title,
        body=payload.body,
        location=payload.location,
        starts_at=datetime.fromisoformat(payload.starts_at.replace("Z", "+00:00")),
        ends_at=(
            datetime.fromisoformat(payload.ends_at.replace("Z", "+00:00"))
            if payload.ends_at
            else None
        ),
        society_id=admin.society_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return EventResponse(
        id=event.id,
        title=event.title,
        body=event.body,
        location=event.location,
        starts_at=event.starts_at.isoformat(),
        ends_at=event.ends_at.isoformat() if event.ends_at else None,
    )
