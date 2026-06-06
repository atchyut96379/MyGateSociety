from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Flat, SocietyTransaction, User
from ..schemas import TransactionResponse
from ..security import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(SocietyTransaction).filter(
        SocietyTransaction.society_id == current_user.society_id
    )
    if current_user.role == "RESIDENT" and current_user.flat_id:
        query = query.filter(SocietyTransaction.flat_id == current_user.flat_id)

    txns = query.order_by(SocietyTransaction.created_at.desc()).limit(100).all()
    return [
        TransactionResponse(
            id=t.id,
            type=t.type,
            amount=t.amount,
            description=t.description,
            method=t.method,
            reference=t.reference,
            flat_label=t.flat.label if t.flat else None,
            created_at=t.created_at.isoformat(),
        )
        for t in txns
    ]
