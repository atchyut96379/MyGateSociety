from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Flat, User
from ..schemas import FlatResponse
from ..security import get_current_user

router = APIRouter(prefix="/flats", tags=["flats"])


@router.get("", response_model=list[FlatResponse])
def list_flats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Flat)
        .filter(Flat.society_id == current_user.society_id)
        .order_by(Flat.floor.asc(), Flat.unit.asc())
        .all()
    )
