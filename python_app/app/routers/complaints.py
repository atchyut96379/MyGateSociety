from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Complaint, User
from ..schemas import ComplaintResponse, CreateComplaintRequest, UpdateComplaintRequest
from ..security import get_current_user, require_roles
from ..utils import new_id

router = APIRouter(prefix="/complaints", tags=["complaints"])


def complaint_response(c: Complaint) -> ComplaintResponse:
    return ComplaintResponse(
        id=c.id,
        subject=c.subject,
        body=c.body,
        category=c.category,
        status=c.status,
        flat_id=c.flat_id,
        flat_label=c.flat.label if c.flat else None,
        user_name=c.user.name if c.user else None,
        admin_note=c.admin_note,
        created_at=c.created_at.isoformat(),
    )


@router.get("", response_model=list[ComplaintResponse])
def list_complaints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Complaint)
    if current_user.role == "RESIDENT":
        query = query.filter(Complaint.user_id == current_user.id)
    elif current_user.role == "COMMITTEE":
        query = query.filter(Complaint.status.in_(["OPEN", "IN_PROGRESS"]))

    items = query.order_by(Complaint.created_at.desc()).limit(50).all()
    return [complaint_response(c) for c in items]


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    payload: CreateComplaintRequest,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    if not current_user.flat_id:
        raise HTTPException(status_code=403, detail="Flat required")

    complaint = Complaint(
        id=new_id(),
        subject=payload.subject,
        body=payload.body,
        category=payload.category or "General",
        flat_id=current_user.flat_id,
        user_id=current_user.id,
    )
    db.add(complaint)
    from ..notify import notify_society_admins

    notify_society_admins(
        db,
        current_user.society_id,
        type="COMPLAINT",
        title="New helpdesk ticket",
        body=f"{complaint.subject} — Flat {current_user.flat.label if current_user.flat else ''}",
        dedupe_key=f"complaint-new:{complaint.id}",
    )
    db.commit()
    db.refresh(complaint)
    return complaint_response(complaint)


@router.patch("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: str,
    payload: UpdateComplaintRequest,
    _: User = Depends(require_roles("ADMIN", "COMMITTEE")),
    db: Session = Depends(get_db),
):
    complaint = db.get(Complaint, complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="Not found")
    if payload.status:
        complaint.status = payload.status
    if payload.admin_note is not None:
        complaint.admin_note = payload.admin_note
    from ..notify import notify_flat_residents

    if complaint.user_id:
        notify_flat_residents(
            db,
            complaint.flat_id,
            type="COMPLAINT",
            title="Helpdesk update",
            body=f"{complaint.subject} — {complaint.status}.",
            dedupe_key=f"complaint:{complaint.id}:{complaint.status}",
        )
    db.commit()
    db.refresh(complaint)
    return complaint_response(complaint)
