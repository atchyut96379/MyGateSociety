from datetime import datetime, timedelta



from fastapi import APIRouter, Depends, HTTPException, Query, status

from fastapi.responses import Response

from sqlalchemy.orm import Session, joinedload



from ..database import get_db

from ..models import Flat, MaintenanceBill, Society, SocietyTransaction, User

from ..config import settings
from ..pdf_receipt import build_receipt_pdf
from ..razorpay_client import (
    create_maintenance_order,
    fetch_order,
    razorpay_configured,
    verify_payment_signature,
)
from ..schemas import (
    BillResponse,
    CollectionDashboardResponse,
    CollectionSummaryResponse,
    GenerateBillsRequest,
    PayBillRequest,
    RazorpayOrderResponse,
    RazorpayVerifyRequest,
)

from ..security import get_current_user, require_roles

from ..utils import new_id



router = APIRouter(prefix="/bills", tags=["bills"])





def _resident_type_label(user: User) -> str | None:
    if user.role == "COMMITTEE" and user.committee_role:
        label = user.committee_role.replace("_", " ").title()
        return f"Committee — {label}"
    if user.role == "ADMIN" or user.is_main_admin:
        return "Secretary"
    if user.resident_type == "IN_HOUSE_OWNER":
        return "Owner"
    if user.resident_type == "TENANT":
        return "Tenant"
    if user.resident_type == "OUT_HOUSE_OWNER":
        return "Out-house owner"
    return user.role.replace("_", " ").title()


def _flat_resident(db: Session, flat_id: str) -> User | None:
    """Primary contact for a flat: resident first, then committee/admin on that flat."""
    resident = (
        db.query(User)
        .filter(User.flat_id == flat_id, User.role == "RESIDENT")
        .order_by(User.created_at.asc())
        .first()
    )
    if resident:
        return resident
    return (
        db.query(User)
        .filter(User.flat_id == flat_id, User.role.in_(["COMMITTEE", "ADMIN"]))
        .order_by(User.is_main_admin.desc(), User.created_at.asc())
        .first()
    )





def bill_response(bill: MaintenanceBill, db: Session | None = None) -> BillResponse:

    txn = bill.transaction

    paid_by_name = None

    resident_name = None

    resident_type = None

    resident_phone = None



    if txn and txn.recorded_by:

        paid_by_name = txn.recorded_by.name



    if db and bill.flat_id:

        resident = _flat_resident(db, bill.flat_id)

        if resident:
            resident_name = resident.name
            resident_type = _resident_type_label(resident)
            resident_phone = resident.phone



    return BillResponse(

        id=bill.id,

        flat_id=bill.flat_id,

        flat_label=bill.flat.label if bill.flat else None,

        month=bill.month,

        amount=bill.amount,

        description=bill.description,

        status=bill.status,

        due_date=bill.due_date.isoformat(),

        paid_at=bill.paid_at.isoformat() if bill.paid_at else None,

        transaction_id=txn.id if txn else None,

        payment_method=txn.method if txn else None,

        paid_by_name=paid_by_name,

        resident_name=resident_name,

        resident_type=resident_type,

        resident_phone=resident_phone,

    )


def _get_unpaid_bill(bill_id: str, db: Session) -> MaintenanceBill:
    bill = (
        db.query(MaintenanceBill)
        .options(joinedload(MaintenanceBill.flat))
        .filter(MaintenanceBill.id == bill_id)
        .first()
    )
    if bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    if bill.status == "PAID":
        raise HTTPException(status_code=400, detail="Already paid")
    return bill


def _record_bill_payment(
    db: Session,
    bill: MaintenanceBill,
    current_user: User,
    *,
    method: str,
    reference: str,
) -> BillResponse:
    bill.status = "PAID"
    bill.paid_at = datetime.utcnow()
    txn = SocietyTransaction(
        id=new_id(),
        type="COLLECTION",
        amount=bill.amount,
        description=f"Maintenance {bill.month} — Flat {bill.flat.label if bill.flat else bill.flat_id}",
        method=method,
        reference=reference,
        society_id=current_user.society_id,
        flat_id=bill.flat_id,
        bill_id=bill.id,
        recorded_by_id=current_user.id,
    )
    db.add(txn)
    db.commit()
    db.refresh(bill)
    return bill_response(bill, db)


@router.get("/collection", response_model=CollectionDashboardResponse)

def collection_dashboard(

    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),

    admin: User = Depends(require_roles("ADMIN", "COMMITTEE")),

    db: Session = Depends(get_db),

):

    society = db.get(Society, admin.society_id)

    if society is None:

        raise HTTPException(status_code=500, detail="Society not found")



    flat_count = db.query(Flat).filter(Flat.society_id == society.id).count()

    bills = (

        db.query(MaintenanceBill)

        .options(

            joinedload(MaintenanceBill.flat),

            joinedload(MaintenanceBill.transaction).joinedload(SocietyTransaction.recorded_by),

        )

        .join(Flat, MaintenanceBill.flat_id == Flat.id)

        .filter(Flat.society_id == society.id, MaintenanceBill.month == month)

        .order_by(Flat.label.asc())

        .all()

    )



    collected = sum(b.amount for b in bills if b.status == "PAID")

    still_pending = sum(b.amount for b in bills if b.status != "PAID")

    flats_paid = sum(1 for b in bills if b.status == "PAID")



    return CollectionDashboardResponse(

        summary=CollectionSummaryResponse(

            month=month,

            collected=collected,

            still_pending=still_pending,

            flats_paid=flats_paid,

            flat_count=flat_count,

        ),

        rows=[bill_response(b, db) for b in bills],

    )





@router.get("/mine", response_model=list[BillResponse])
def my_bills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.flat_id:
        return []
    bills = (
        db.query(MaintenanceBill)
        .options(
            joinedload(MaintenanceBill.flat),
            joinedload(MaintenanceBill.transaction).joinedload(SocietyTransaction.recorded_by),
        )
        .filter(MaintenanceBill.flat_id == current_user.flat_id)
        .order_by(MaintenanceBill.due_date.desc())
        .limit(50)
        .all()
    )
    return [bill_response(b, db) for b in bills]


@router.get("", response_model=list[BillResponse])
def list_bills(

    current_user: User = Depends(get_current_user),

    db: Session = Depends(get_db),

):

    query = (

        db.query(MaintenanceBill)

        .options(

            joinedload(MaintenanceBill.flat),

            joinedload(MaintenanceBill.transaction).joinedload(SocietyTransaction.recorded_by),

        )

        .join(Flat, MaintenanceBill.flat_id == Flat.id)

    )

    if current_user.role == "RESIDENT":

        if not current_user.flat_id:

            return []

        query = query.filter(MaintenanceBill.flat_id == current_user.flat_id)

    else:

        query = query.filter(Flat.society_id == current_user.society_id)



    bills = query.order_by(MaintenanceBill.due_date.desc()).limit(100).all()

    return [bill_response(b, db) for b in bills]





@router.post("/generate", response_model=list[BillResponse])

def generate_bills(

    payload: GenerateBillsRequest,

    admin: User = Depends(require_roles("ADMIN", "COMMITTEE")),

    db: Session = Depends(get_db),

):

    society = db.get(Society, admin.society_id)

    if society is None:

        raise HTTPException(status_code=500, detail="Society not found")



    month = payload.month or datetime.utcnow().strftime("%Y-%m")

    due = datetime.utcnow() + timedelta(days=15)

    flats = db.query(Flat).filter(Flat.society_id == society.id).all()

    created: list[MaintenanceBill] = []



    for flat in flats:

        exists = (

            db.query(MaintenanceBill)

            .filter(MaintenanceBill.flat_id == flat.id, MaintenanceBill.month == month)

            .first()

        )

        if exists:

            continue

        bill = MaintenanceBill(

            id=new_id(),

            flat_id=flat.id,

            month=month,

            amount=society.maintenance_amount_per_flat,

            description=f"Monthly maintenance",

            due_date=due,

        )

        db.add(bill)

        created.append(bill)



    from ..notify import notify_flat_residents



    for bill in created:

        notify_flat_residents(

            db,

            bill.flat_id,

            type="BILL",

            title=f"Maintenance bill — {month}",

            body=f"₹{bill.amount:.0f} due by {due.strftime('%d %b %Y')}.",

            dedupe_key=f"bill:{bill.id}",

        )



    db.commit()

    for b in created:

        db.refresh(b)

    return [bill_response(b, db) for b in created]





@router.get("/{bill_id}/receipt")

def download_receipt(

    bill_id: str,

    current_user: User = Depends(get_current_user),

    db: Session = Depends(get_db),

):

    bill = (

        db.query(MaintenanceBill)

        .options(

            joinedload(MaintenanceBill.flat),

            joinedload(MaintenanceBill.transaction).joinedload(SocietyTransaction.recorded_by),

        )

        .filter(MaintenanceBill.id == bill_id)

        .first()

    )

    if bill is None:

        raise HTTPException(status_code=404, detail="Bill not found")

    if bill.status != "PAID":

        raise HTTPException(status_code=400, detail="Receipt available only for paid bills")



    if current_user.role == "RESIDENT":

        if bill.flat_id != current_user.flat_id:

            raise HTTPException(status_code=403, detail="Forbidden")

    elif current_user.role not in {"ADMIN", "COMMITTEE"}:

        raise HTTPException(status_code=403, detail="Forbidden")



    society = db.get(Society, current_user.society_id)

    if society is None:

        raise HTTPException(status_code=500, detail="Society not found")



    payer = bill.transaction.recorded_by if bill.transaction else None

    pdf_bytes = build_receipt_pdf(bill, society, bill.transaction, payer)

    flat_label = bill.flat.label if bill.flat else bill_id

    filename = f"receipt-{flat_label}-{bill.month}.pdf"



    return Response(

        content=pdf_bytes,

        media_type="application/pdf",

        headers={"Content-Disposition": f'attachment; filename="{filename}"'},

    )





@router.post("/{bill_id}/razorpay-order", response_model=RazorpayOrderResponse)
def create_razorpay_order(
    bill_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not razorpay_configured():
        raise HTTPException(status_code=503, detail="Online payment is not configured")
    if not current_user.flat_id:
        raise HTTPException(status_code=403, detail="No flat linked to your account")

    bill = _get_unpaid_bill(bill_id, db)
    if bill.flat_id != current_user.flat_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    society = db.get(Society, current_user.society_id)
    if society is None:
        raise HTTPException(status_code=500, detail="Society not found")

    flat_label = bill.flat.label if bill.flat else bill.flat_id
    order = create_maintenance_order(
        bill_id=bill.id,
        amount_rupees=bill.amount,
        flat_label=flat_label,
        month=bill.month,
    )

    return RazorpayOrderResponse(
        key_id=settings.razorpay_key_id,
        order_id=order["id"],
        amount=order["amount"],
        currency=order.get("currency", "INR"),
        bill_id=bill.id,
        description=f"Maintenance {bill.month} — Flat {flat_label}",
        society_name=society.association_name,
    )


@router.post("/{bill_id}/razorpay-verify", response_model=BillResponse)
def verify_razorpay_payment(
    bill_id: str,
    payload: RazorpayVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.flat_id:
        raise HTTPException(status_code=403, detail="No flat linked to your account")
    bill = _get_unpaid_bill(bill_id, db)
    if bill.flat_id != current_user.flat_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    verify_payment_signature(
        order_id=payload.razorpay_order_id,
        payment_id=payload.razorpay_payment_id,
        signature=payload.razorpay_signature,
    )

    order = fetch_order(payload.razorpay_order_id)
    if order.get("receipt") != bill.id[:40]:
        raise HTTPException(status_code=400, detail="Order does not match this bill")
    if int(order.get("amount", 0)) != int(round(bill.amount * 100)):
        raise HTTPException(status_code=400, detail="Paid amount does not match bill")

    return _record_bill_payment(
        db,
        bill,
        current_user,
        method="RAZORPAY",
        reference=payload.razorpay_payment_id,
    )


@router.post("/{bill_id}/pay", response_model=BillResponse)
def pay_bill(
    bill_id: str,
    payload: PayBillRequest,
    current_user: User = Depends(require_roles("ADMIN", "COMMITTEE")),
    db: Session = Depends(get_db),
):
    bill = _get_unpaid_bill(bill_id, db)
    reference = payload.reference or f"TXN{new_id()[:10].upper()}"
    return _record_bill_payment(
        db,
        bill,
        current_user,
        method=payload.method,
        reference=reference,
    )


