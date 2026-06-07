from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .constants import COMMITTEE_ROLES
from .models import DirectoryEntry, Flat, Society, User
from .security import hash_password, normalize_phone
from .utils import default_user_password, new_id


def validate_create_user_payload(payload, db: Session) -> None:
    if payload.role == "RESIDENT":
        if not payload.flat_id:
            raise HTTPException(status_code=400, detail="Flat required")
        if not payload.resident_type:
            raise HTTPException(status_code=400, detail="Resident type required")
        if payload.resident_type == "TENANT":
            if not (payload.tenant_owner_name or "").strip() or not (
                payload.tenant_owner_phone or ""
            ).strip():
                raise HTTPException(
                    status_code=400,
                    detail="Tenant requires original owner name and mobile",
                )

    if payload.role == "COMMITTEE":
        if not payload.committee_role:
            raise HTTPException(status_code=400, detail="Committee role required")
        if payload.committee_role == "SECRETARY":
            raise HTTPException(
                status_code=400,
                detail="Secretary is the main account and cannot be created again",
            )
        if payload.committee_role not in COMMITTEE_ROLES:
            raise HTTPException(status_code=400, detail="Invalid committee role")
        if not payload.flat_id:
            raise HTTPException(status_code=400, detail="Flat required for committee members")
    if payload.role == "ADMIN":
        raise HTTPException(
            status_code=400,
            detail="Secretary account already exists. Use Committee role for other members.",
        )


def create_user_record(
    db: Session,
    admin: User,
    payload,
    *,
    import_mode: bool = False,
) -> tuple[User, str, str | None]:
    if import_mode and payload.resident_type == "TENANT":
        if not (payload.tenant_owner_name or "").strip():
            payload.tenant_owner_name = "Owner (update in office)"
        if not (payload.tenant_owner_phone or "").strip():
            payload.tenant_owner_phone = admin.phone

    validate_create_user_payload(payload, db)

    phone = normalize_phone(payload.phone)
    if not phone:
        raise HTTPException(status_code=400, detail="Valid mobile number required")
    if db.query(User).filter(User.phone == phone).first():
        raise HTTPException(status_code=409, detail=f"Mobile {phone} already registered")

    society = db.get(Society, admin.society_id)
    if society is None:
        raise HTTPException(status_code=500, detail="Society not found")

    flat_label: str | None = None
    if payload.flat_id:
        flat = db.get(Flat, payload.flat_id)
        if flat is None or flat.society_id != admin.society_id:
            raise HTTPException(status_code=400, detail="Invalid flat")
        flat_label = flat.label

    plain_password = default_user_password(
        society.association_name,
        payload.role,
        flat_label,
        payload.committee_role,
    )

    resident_type = payload.resident_type
    if payload.role == "COMMITTEE" and not resident_type:
        resident_type = "IN_HOUSE_OWNER"

    user = User(
        id=new_id(),
        phone=phone,
        email=payload.email or None,
        password_hash=hash_password(plain_password),
        name=payload.name.strip(),
        role=payload.role,
        resident_type=resident_type if payload.role in {"RESIDENT", "COMMITTEE"} else None,
        committee_role=payload.committee_role if payload.role == "COMMITTEE" else None,
        is_main_admin=False,
        flat_id=payload.flat_id,
        tenant_owner_name=(
            payload.tenant_owner_name.strip()
            if payload.resident_type == "TENANT" and payload.tenant_owner_name
            else None
        ),
        tenant_owner_phone=(
            normalize_phone(payload.tenant_owner_phone)
            if payload.resident_type == "TENANT" and payload.tenant_owner_phone
            else None
        ),
        tenant_owner_flat_label=(
            (payload.tenant_owner_flat_label or flat_label or "").strip() or None
            if payload.resident_type == "TENANT"
            else None
        ),
        society_id=admin.society_id,
        must_change_password=True,
    )
    db.add(user)
    db.flush()

    if user.role in {"RESIDENT", "COMMITTEE"} and user.flat_id:
        existing = (
            db.query(DirectoryEntry).filter(DirectoryEntry.flat_id == user.flat_id).first()
        )
        if existing is None:
            db.add(
                DirectoryEntry(
                    id=new_id(),
                    flat_id=user.flat_id,
                    display_name=user.name,
                    phone=user.phone,
                    show_in_directory=True,
                )
            )
        else:
            existing.display_name = user.name
            existing.phone = user.phone

    return user, plain_password, flat_label


def validate_role_update(payload, *, existing: User) -> None:
    if existing.is_main_admin:
        raise HTTPException(
            status_code=400,
            detail="Secretary account cannot be changed from here",
        )
    if payload.role == "ADMIN":
        raise HTTPException(
            status_code=400,
            detail="Secretary account already exists",
        )
    if payload.role == "SECURITY":
        return
    if payload.role == "RESIDENT":
        if not payload.flat_id:
            raise HTTPException(status_code=400, detail="Flat required")
        if not payload.resident_type:
            raise HTTPException(status_code=400, detail="Resident type required")
        if payload.resident_type == "TENANT":
            if not (payload.tenant_owner_name or "").strip() or not (
                payload.tenant_owner_phone or ""
            ).strip():
                raise HTTPException(
                    status_code=400,
                    detail="Tenant requires original owner name and mobile",
                )
    if payload.role == "COMMITTEE":
        if not payload.committee_role:
            raise HTTPException(status_code=400, detail="Committee role required")
        if payload.committee_role == "SECRETARY":
            raise HTTPException(
                status_code=400,
                detail="Secretary is the main account and cannot be assigned again",
            )
        if payload.committee_role not in COMMITTEE_ROLES:
            raise HTTPException(status_code=400, detail="Invalid committee role")
        if not payload.flat_id:
            raise HTTPException(status_code=400, detail="Flat required for committee members")


def _apply_role_fields(user: User, payload) -> None:
    user.role = payload.role
    if payload.role in {"RESIDENT", "COMMITTEE"}:
        user.flat_id = payload.flat_id
        user.resident_type = payload.resident_type or (
            "IN_HOUSE_OWNER" if payload.role == "COMMITTEE" else user.resident_type
        )
    else:
        user.flat_id = None
        user.resident_type = None
        user.committee_role = None

    if payload.role == "COMMITTEE":
        user.committee_role = payload.committee_role
    elif payload.role == "RESIDENT":
        user.committee_role = None

    if user.resident_type == "TENANT":
        user.tenant_owner_name = (payload.tenant_owner_name or "").strip() or None
        user.tenant_owner_phone = (
            normalize_phone(payload.tenant_owner_phone)
            if payload.tenant_owner_phone
            else None
        )
        user.tenant_owner_flat_label = (
            (payload.tenant_owner_flat_label or "").strip() or None
        )
    else:
        user.tenant_owner_name = None
        user.tenant_owner_phone = None
        user.tenant_owner_flat_label = None


def update_user_role(db: Session, admin: User, user_id: str, payload) -> User:
    user = db.get(User, user_id)
    if user is None or user.society_id != admin.society_id:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.flat_id:
        flat = db.get(Flat, payload.flat_id)
        if flat is None or flat.society_id != admin.society_id:
            raise HTTPException(status_code=400, detail="Invalid flat")

    validate_role_update(payload, existing=user)
    _apply_role_fields(user, payload)
    db.flush()
    return user


def update_user_login(
    db: Session,
    admin: User,
    user_id: str,
    payload,
) -> tuple[User, str, str | None]:
    user = db.get(User, user_id)
    if user is None or user.society_id != admin.society_id:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.flat_id:
        flat = db.get(Flat, payload.flat_id)
        if flat is None or flat.society_id != admin.society_id:
            raise HTTPException(status_code=400, detail="Invalid flat")

    validate_role_update(payload, existing=user)

    _apply_role_fields(user, payload)
    db.flush()
    flat_label = user.flat.label if user.flat else None

    society = db.get(Society, admin.society_id)
    if society is None:
        raise HTTPException(status_code=500, detail="Society not found")

    plain_password = default_user_password(
        society.association_name,
        user.role,
        flat_label,
        user.committee_role,
    )
    user.password_hash = hash_password(plain_password)
    user.must_change_password = True

    return user, plain_password, flat_label


def resolve_flat_id(db: Session, society_id: str, flat_label: str) -> str:
    label = str(flat_label).strip()
    if isinstance(flat_label, float) and flat_label.is_integer():
        label = str(int(flat_label))
    candidates = [label, label.replace("-", "/"), label.replace("/", "-")]
    if label.isdigit():
        candidates.append(str(int(label)))
    seen: set[str] = set()
    flat = None
    for candidate in candidates:
        if not candidate or candidate in seen:
            continue
        seen.add(candidate)
        flat = (
            db.query(Flat)
            .filter(Flat.society_id == society_id, Flat.label == candidate)
            .first()
        )
        if flat is not None:
            break
    if flat is None:
        raise HTTPException(status_code=400, detail=f"Flat not found: {label}")
    return flat.id
