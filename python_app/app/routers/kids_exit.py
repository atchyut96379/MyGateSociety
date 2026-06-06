from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import KidExitRequest, User
from ..schemas import CreateKidExitRequest, KidExitResponse
from ..security import get_current_user, require_roles
from ..utils import generate_otp, new_id

router = APIRouter(prefix="/kids-exit", tags=["kids-exit"])


def kid_response(k: KidExitRequest) -> KidExitResponse:
    return KidExitResponse(
        id=k.id,
        child_name=k.child_name,
        child_age=k.child_age,
        status=k.status,
        otp=k.otp,
        flat_label=k.flat.label if k.flat else None,
        parent_name=k.parent.name if k.parent else None,
        requested_at=k.requested_at.isoformat(),
    )


@router.get("", response_model=list[KidExitResponse])
def list_kid_exits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "RESIDENT":
        items = (
            db.query(KidExitRequest)
            .filter(KidExitRequest.parent_id == current_user.id)
            .order_by(KidExitRequest.requested_at.desc())
            .limit(20)
            .all()
        )
    else:
        items = (
            db.query(KidExitRequest)
            .filter(KidExitRequest.status.in_(["PENDING_APPROVAL", "APPROVED"]))
            .order_by(KidExitRequest.requested_at.desc())
            .limit(20)
            .all()
        )
    return [kid_response(k) for k in items]


@router.post("", response_model=KidExitResponse, status_code=status.HTTP_201_CREATED)
def create_kid_exit(
    payload: CreateKidExitRequest,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    if not current_user.flat_id:
        raise HTTPException(status_code=403, detail="Flat required")

    item = KidExitRequest(
        id=new_id(),
        child_name=payload.child_name,
        child_age=payload.child_age,
        flat_id=current_user.flat_id,
        parent_id=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return kid_response(item)


@router.post("/{request_id}/approve", response_model=KidExitResponse)
def approve_kid_exit(
    request_id: str,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    item = db.get(KidExitRequest, request_id)
    if item is None or item.parent_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    item.status = "APPROVED"
    item.otp = generate_otp()
    item.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return kid_response(item)


@router.post("/{request_id}/deny", response_model=KidExitResponse)
def deny_kid_exit(
    request_id: str,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    item = db.get(KidExitRequest, request_id)
    if item is None or item.parent_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found")
    item.status = "DENIED"
    db.commit()
    db.refresh(item)
    return kid_response(item)
