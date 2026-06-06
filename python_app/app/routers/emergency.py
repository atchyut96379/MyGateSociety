from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import EmergencyContact, User
from ..schemas import CreateEmergencyRequest, EmergencyContactResponse
from ..security import get_current_user, require_roles
from ..utils import new_id

router = APIRouter(prefix="/emergency", tags=["emergency"])


@router.get("", response_model=list[EmergencyContactResponse])
def list_emergency_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contacts = (
        db.query(EmergencyContact)
        .filter(EmergencyContact.society_id == current_user.society_id)
        .order_by(EmergencyContact.name.asc())
        .all()
    )
    return [
        EmergencyContactResponse(id=c.id, name=c.name, role=c.role, phone=c.phone)
        for c in contacts
    ]


@router.post("", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
def create_emergency_contact(
    payload: CreateEmergencyRequest,
    admin: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
):
    contact = EmergencyContact(
        id=new_id(),
        name=payload.name,
        role=payload.role,
        phone=payload.phone,
        society_id=admin.society_id,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return EmergencyContactResponse(
        id=contact.id, name=contact.name, role=contact.role, phone=contact.phone
    )
