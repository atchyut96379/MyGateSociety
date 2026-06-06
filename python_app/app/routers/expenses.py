from datetime import datetime

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SocietyExpense, SocietyTransaction, User
from ..schemas import CreateExpenseRequest, ExpenseResponse
from ..security import get_current_user, require_roles
from ..utils import new_id

router = APIRouter(prefix="/expenses", tags=["expenses"])


def expense_response(expense: SocietyExpense) -> ExpenseResponse:
    return ExpenseResponse(
        id=expense.id,
        title=expense.title,
        category=expense.category,
        amount=expense.amount,
        description=expense.description,
        paid_to=expense.paid_to,
        expense_date=expense.expense_date.isoformat(),
        receipt_ref=expense.receipt_ref,
        recorded_by_name=expense.recorded_by.name if expense.recorded_by else None,
        created_at=expense.created_at.isoformat(),
    )


@router.get("", response_model=list[ExpenseResponse])
def list_expenses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = (
        db.query(SocietyExpense)
        .filter(SocietyExpense.society_id == current_user.society_id)
        .order_by(SocietyExpense.expense_date.desc())
        .limit(100)
        .all()
    )
    return [expense_response(e) for e in items]


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: CreateExpenseRequest,
    admin: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
):
    expense = SocietyExpense(
        id=new_id(),
        title=payload.title,
        category=payload.category,
        amount=payload.amount,
        description=payload.description,
        paid_to=payload.paid_to,
        expense_date=datetime.fromisoformat(payload.expense_date.replace("Z", "+00:00")),
        receipt_ref=payload.receipt_ref,
        society_id=admin.society_id,
        recorded_by_id=admin.id,
    )
    db.add(expense)
    db.flush()

    db.add(
        SocietyTransaction(
            id=new_id(),
            type="EXPENSE",
            amount=expense.amount,
            description=expense.title,
            method="CASH",
            reference=expense.receipt_ref,
            society_id=admin.society_id,
            expense_id=expense.id,
            recorded_by_id=admin.id,
        )
    )
    db.commit()
    db.refresh(expense)
    return expense_response(expense)
