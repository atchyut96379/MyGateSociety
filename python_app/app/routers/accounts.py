from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Flat, MaintenanceBill, SocietyExpense, SocietyTransaction, User
from ..schemas import AccountsSummaryResponse
from ..security import get_current_user

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("/summary", response_model=AccountsSummaryResponse)
def accounts_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    society_id = current_user.society_id

    collected = (
        db.query(func.coalesce(func.sum(SocietyTransaction.amount), 0))
        .filter(
            SocietyTransaction.society_id == society_id,
            SocietyTransaction.type == "COLLECTION",
        )
        .scalar()
    )
    expenses = (
        db.query(func.coalesce(func.sum(SocietyExpense.amount), 0))
        .filter(SocietyExpense.society_id == society_id)
        .scalar()
    )
    pending = (
        db.query(func.count(MaintenanceBill.id))
        .join(Flat, MaintenanceBill.flat_id == Flat.id)
        .filter(Flat.society_id == society_id, MaintenanceBill.status == "UNPAID")
        .scalar()
    )
    flat_count = db.query(func.count(Flat.id)).filter(Flat.society_id == society_id).scalar()

    collected_f = float(collected or 0)
    expenses_f = float(expenses or 0)

    return AccountsSummaryResponse(
        total_collected=collected_f,
        total_expenses=expenses_f,
        balance=collected_f - expenses_f,
        pending_bills=int(pending or 0),
        flat_count=int(flat_count or 0),
    )
