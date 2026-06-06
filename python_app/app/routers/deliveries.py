from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DeliveryPass, User
from ..schemas import CreateDeliveryRequest, DeliveryResponse
from ..security import get_current_user, require_roles
from ..utils import generate_otp, new_id

router = APIRouter(prefix="/deliveries", tags=["deliveries"])


class UpdateDeliveryRequest(BaseModel):
    status: str


def delivery_response(delivery: DeliveryPass) -> DeliveryResponse:
    return DeliveryResponse(
        id=delivery.id,
        company=delivery.company,
        description=delivery.description,
        otp=delivery.otp,
        mode=delivery.mode,
        status=delivery.status,
        flat_id=delivery.flat_id,
        flat_label=delivery.flat.label if delivery.flat else None,
        created_by_name=delivery.created_by.name if delivery.created_by else None,
    )


@router.get("", response_model=list[DeliveryResponse])
def list_deliveries(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(DeliveryPass)

    if current_user.role == "RESIDENT":
        if not current_user.flat_id:
            return []
        query = query.filter(DeliveryPass.flat_id == current_user.flat_id)
    elif current_user.role == "SECURITY":
        query = query.filter(DeliveryPass.status.in_(["PENDING", "DELIVERED"]))

    deliveries = query.order_by(DeliveryPass.created_at.desc()).limit(50).all()
    return [delivery_response(delivery) for delivery in deliveries]


@router.post("", response_model=DeliveryResponse, status_code=status.HTTP_201_CREATED)
def create_delivery(
    payload: CreateDeliveryRequest,
    current_user: User = Depends(require_roles("RESIDENT")),
    db: Session = Depends(get_db),
):
    if not current_user.flat_id:
        raise HTTPException(status_code=403, detail="Resident flat required")

    delivery = DeliveryPass(
        id=new_id(),
        company=payload.company,
        description=payload.description,
        otp=generate_otp(),
        mode=payload.mode,
        status="PENDING",
        flat_id=current_user.flat_id,
        created_by_id=current_user.id,
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return delivery_response(delivery)


@router.patch("/{delivery_id}", response_model=DeliveryResponse)
def update_delivery(
    delivery_id: str,
    payload: UpdateDeliveryRequest,
    _: User = Depends(require_roles("SECURITY", "ADMIN")),
    db: Session = Depends(get_db),
):
    delivery = db.get(DeliveryPass, delivery_id)
    if delivery is None:
        raise HTTPException(status_code=404, detail="Not found")
    delivery.status = payload.status
    if payload.status == "DELIVERED":
        delivery.delivered_at = datetime.utcnow()
    if payload.status == "COLLECTED":
        delivery.collected_at = datetime.utcnow()
    from ..notify import notify_flat_residents

    notify_flat_residents(
        db,
        delivery.flat_id,
        type="DELIVERY",
        title="Delivery update",
        body=f"{delivery.company} — status: {payload.status}.",
        dedupe_key=f"delivery:{delivery.id}:{payload.status}",
    )
    db.commit()
    db.refresh(delivery)
    return delivery_response(delivery)
