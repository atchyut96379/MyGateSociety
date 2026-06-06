from datetime import datetime

from sqlalchemy.orm import Session

from .models import ResidentNotification, User
from .utils import new_id


def push_notification(
    db: Session,
    user_id: str,
    *,
    type: str,
    title: str,
    body: str,
    dedupe_key: str | None = None,
) -> ResidentNotification:
    if dedupe_key:
        existing = (
            db.query(ResidentNotification)
            .filter(
                ResidentNotification.user_id == user_id,
                ResidentNotification.dedupe_key == dedupe_key,
            )
            .first()
        )
        if existing:
            existing.title = title
            existing.body = body
            existing.read = False
            existing.created_at = datetime.utcnow()
            return existing

    item = ResidentNotification(
        id=new_id(),
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        dedupe_key=dedupe_key,
    )
    db.add(item)
    return item


def notify_flat_residents(
    db: Session,
    flat_id: str,
    *,
    type: str,
    title: str,
    body: str,
    dedupe_key: str | None = None,
) -> None:
    residents = (
        db.query(User)
        .filter(User.flat_id == flat_id, User.role == "RESIDENT")
        .all()
    )
    for resident in residents:
        push_notification(
            db,
            resident.id,
            type=type,
            title=title,
            body=body,
            dedupe_key=dedupe_key,
        )


def notify_society_admins(
    db: Session,
    society_id: str,
    *,
    type: str,
    title: str,
    body: str,
    dedupe_key: str | None = None,
) -> None:
    admins = (
        db.query(User)
        .filter(User.society_id == society_id, User.role.in_(["ADMIN", "COMMITTEE"]))
        .all()
    )
    for admin in admins:
        key = f"{dedupe_key}:{admin.id}" if dedupe_key else None
        push_notification(db, admin.id, type=type, title=title, body=body, dedupe_key=key)


def notify_society_residents(
    db: Session,
    society_id: str,
    *,
    type: str,
    title: str,
    body: str,
    dedupe_key: str | None = None,
) -> None:
    residents = (
        db.query(User)
        .filter(User.society_id == society_id, User.role == "RESIDENT")
        .all()
    )
    for resident in residents:
        push_notification(
            db,
            resident.id,
            type=type,
            title=title,
            body=body,
            dedupe_key=dedupe_key,
        )
