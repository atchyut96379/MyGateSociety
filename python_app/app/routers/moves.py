from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Flat, MoveRequest, User
from ..schemas import CreateMoveRequest, MoveRequestResponse, UpdateMoveRequest
from ..security import get_current_user, require_roles
from ..utils import new_id

router = APIRouter(prefix="/moves", tags=["moves"])


def move_response(m: MoveRequest) -> MoveRequestResponse:
    return MoveRequestResponse(
        id=m.id,
        type=m.type,
        status=m.status,
        flat_label=m.flat.label if m.flat else None,
        user_name=m.user.name if m.user else None,
        move_date=m.move_date.isoformat(),
        notes=m.notes,
        created_at=m.created_at.isoformat(),
    )


@router.get("", response_model=list[MoveRequestResponse])
def list_moves(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(MoveRequest)
    if current_user.role == "RESIDENT":
        query = query.filter(MoveRequest.user_id == current_user.id)
    else:
        society_flat_ids = [
            f.id
            for f in db.query(Flat).filter(Flat.society_id == current_user.society_id).all()
        ]
        query = query.filter(MoveRequest.flat_id.in_(society_flat_ids))

    items = query.order_by(MoveRequest.created_at.desc()).limit(50).all()
    return [move_response(m) for m in items]


@router.post("", response_model=MoveRequestResponse, status_code=status.HTTP_201_CREATED)
def create_move(
    payload: CreateMoveRequest,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    if not current_user.flat_id:
        raise HTTPException(status_code=403, detail="Flat required")

    item = MoveRequest(
        id=new_id(),
        type=payload.type,
        flat_id=current_user.flat_id,
        user_id=current_user.id,
        move_date=datetime.fromisoformat(payload.move_date.replace("Z", "+00:00")),
        notes=payload.notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return move_response(item)


@router.patch("/{move_id}", response_model=MoveRequestResponse)
def update_move(
    move_id: str,
    payload: UpdateMoveRequest,
    _: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
):
    item = db.get(MoveRequest, move_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Not found")
    item.status = payload.status
    from ..notify import notify_flat_residents

    if item.flat_id:
        notify_flat_residents(
            db,
            item.flat_id,
            type="MOVE",
            title="Move request update",
            body=f"Your {item.type.replace('_', ' ').lower()} request is {payload.status}.",
            dedupe_key=f"move:{item.id}:{payload.status}",
        )
    db.commit()
    db.refresh(item)
    return move_response(item)
