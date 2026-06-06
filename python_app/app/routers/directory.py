from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DirectoryEntry, Flat, User
from ..schemas import DirectoryResponse, UpdateDirectoryRequest
from ..security import get_current_user, require_roles
from ..utils import new_id

router = APIRouter(prefix="/directory", tags=["directory"])


@router.get("", response_model=list[DirectoryResponse])
def list_directory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entries = (
        db.query(DirectoryEntry)
        .join(Flat, DirectoryEntry.flat_id == Flat.id)
        .filter(
            Flat.society_id == current_user.society_id,
            DirectoryEntry.show_in_directory == True,  # noqa: E712
        )
        .order_by(Flat.label.asc())
        .all()
    )
    return [
        DirectoryResponse(
            id=e.id,
            flat_label=e.flat.label if e.flat else None,
            display_name=e.display_name,
            phone=e.phone,
            show_in_directory=e.show_in_directory,
        )
        for e in entries
    ]


@router.patch("/me", response_model=DirectoryResponse)
def update_my_directory(
    payload: UpdateDirectoryRequest,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    if not current_user.flat_id:
        raise HTTPException(status_code=403, detail="Flat required")

    entry = (
        db.query(DirectoryEntry).filter(DirectoryEntry.flat_id == current_user.flat_id).first()
    )
    if entry is None:
        entry = DirectoryEntry(
            id=new_id(),
            flat_id=current_user.flat_id,
            display_name=payload.display_name or current_user.name,
            phone=payload.phone or current_user.phone,
            show_in_directory=payload.show_in_directory if payload.show_in_directory is not None else True,
        )
        db.add(entry)
    else:
        if payload.display_name is not None:
            entry.display_name = payload.display_name
        if payload.phone is not None:
            entry.phone = payload.phone
        if payload.show_in_directory is not None:
            entry.show_in_directory = payload.show_in_directory

    db.commit()
    db.refresh(entry)
    return DirectoryResponse(
        id=entry.id,
        flat_label=entry.flat.label if entry.flat else None,
        display_name=entry.display_name,
        phone=entry.phone,
        show_in_directory=entry.show_in_directory,
    )
