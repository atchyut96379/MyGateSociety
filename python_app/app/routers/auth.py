from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..constants import SECRETARY_LOGIN_ID
from ..database import get_db
from ..models import DirectoryEntry, Flat, Society, User, Vehicle
from ..schemas import (
    ChangePasswordRequest,
    CompleteSetupRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginConfigResponse,
    LoginRequest,
    MeResponse,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)
from ..utils import default_user_password
from ..security import (
    create_access_token,
    find_user_by_login,
    find_user_for_role_login,
    get_current_user,
    hash_password,
    is_bootstrap_login_input,
    is_bootstrap_secretary,
    normalize_phone,
    phone_match_filters,
    secretary_bootstrap_pending,
    verify_password,
)
from ..utils import new_id

router = APIRouter(prefix="/auth", tags=["auth"])


def redirect_for_role(role: str, must_change_password: bool) -> str:
    if must_change_password:
        return "/setup"
    if role in {"ADMIN", "COMMITTEE"}:
        return "/admin"
    if role == "SECURITY":
        return "/security"
    return "/resident"


def user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        phone=user.phone,
        name=user.name,
        role=user.role,
        society_id=user.society_id,
        flat_id=user.flat_id,
        flat_label=user.flat.label if user.flat else None,
        resident_type=user.resident_type,
        committee_role=user.committee_role,
        is_main_admin=user.is_main_admin,
        must_change_password=user.must_change_password,
    )


def sync_directory(
    db: Session,
    user: User,
    *,
    display_name: str,
    contact_phone: str | None,
    show_in_directory: bool,
) -> None:
    if not user.flat_id:
        return
    entry = (
        db.query(DirectoryEntry).filter(DirectoryEntry.flat_id == user.flat_id).first()
    )
    if entry is None:
        db.add(
            DirectoryEntry(
                id=new_id(),
                flat_id=user.flat_id,
                display_name=display_name,
                phone=contact_phone or user.phone,
                show_in_directory=show_in_directory,
            )
        )
    else:
        entry.display_name = display_name
        entry.phone = contact_phone or user.phone
        entry.show_in_directory = show_in_directory


@router.get("/login-config", response_model=LoginConfigResponse)
def login_config(db: Session = Depends(get_db)):
    return LoginConfigResponse(
        bootstrap_mode=secretary_bootstrap_pending(db),
        bootstrap_login_id=SECRETARY_LOGIN_ID,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    bootstrap = secretary_bootstrap_pending(db)

    if bootstrap:
        if not is_bootstrap_login_input(payload.phone):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Secretary not set up yet. Use login ID '{SECRETARY_LOGIN_ID}' and password 'admin'.",
            )
        if payload.role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Select Secretary (Main Admin) for first-time setup",
            )
        user = find_user_by_login(db, payload.phone)
    else:
        if is_bootstrap_login_input(payload.phone):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Secretary setup is complete. Sign in with your mobile number.",
            )
        digits = normalize_phone(payload.phone)
        if not digits or len(digits) < 10:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Enter your 10-digit mobile number",
            )
        user = find_user_for_role_login(db, payload.phone, payload.role)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found for this mobile number. Check the number or use Forgot password.",
        )

    if payload.role == "ADMIN":
        if not user.is_main_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This mobile number is not registered as Secretary. Select the correct role.",
            )
    elif user.role != payload.role:
        role_hint = {
            "ADMIN": "Secretary (Main Admin)",
            "COMMITTEE": "Committee member",
            "RESIDENT": "Resident",
            "SECURITY": "Guard",
        }.get(user.role, user.role)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"This mobile is registered as {role_hint}. Select that role below.",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Use Forgot password to reset to the office default.",
        )

    return TokenResponse(
        access_token=create_access_token(user),
        redirect=redirect_for_role(user.role, user.must_change_password),
        must_change_password=user.must_change_password,
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    if secretary_bootstrap_pending(db):
        raise HTTPException(
            status_code=400,
            detail=f"Secretary not set up yet. Use login ID '{SECRETARY_LOGIN_ID}' and password 'admin'.",
        )

    digits = normalize_phone(payload.phone)
    if not digits or len(digits) < 10:
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number")

    user = find_user_for_role_login(db, payload.phone, payload.role)
    if user is None:
        raise HTTPException(
            status_code=404,
            detail="No account found for this mobile number and role",
        )

    if payload.role == "COMMITTEE":
        if not payload.committee_role:
            raise HTTPException(status_code=400, detail="Select your committee role")
        if user.committee_role != payload.committee_role:
            raise HTTPException(
                status_code=400,
                detail="Committee role does not match this account",
            )

    society = db.get(Society, user.society_id)
    if society is None:
        raise HTTPException(status_code=500, detail="Society not found")

    flat_label = user.flat.label if user.flat else None
    plain_password = default_user_password(
        society.association_name,
        user.role,
        flat_label,
        user.committee_role,
    )
    user.password_hash = hash_password(plain_password)
    user.must_change_password = True
    db.commit()

    return ForgotPasswordResponse(
        ok=True,
        message="Password reset to the office default. Sign in and complete profile setup if prompted.",
        password=plain_password,
        must_change_password=True,
    )


@router.get("/me", response_model=MeResponse)
def me(user: User = Depends(get_current_user)):
    return MeResponse(user=user_response(user))


@router.post("/complete-setup")
def complete_setup(
    payload: CompleteSetupRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.must_change_password:
        raise HTTPException(status_code=400, detail="Account setup already completed")
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    if payload.new_password == payload.current_password:
        raise HTTPException(status_code=400, detail="Choose a different password than the office default")

    name = payload.name.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Enter your full name")

    user.name = name
    user.email = payload.email.strip() if payload.email else None
    user.password_hash = hash_password(payload.new_password)
    user.must_change_password = False

    if user.is_main_admin and is_bootstrap_secretary(user):
        if not payload.contact_phone:
            raise HTTPException(
                status_code=400,
                detail="Mobile number is required — it becomes your login ID",
            )
        if not payload.flat_id:
            raise HTTPException(
                status_code=400,
                detail="Flat number is required — Secretary is also a resident",
            )
        flat = db.get(Flat, payload.flat_id)
        if flat is None or flat.society_id != user.society_id:
            raise HTTPException(status_code=400, detail="Invalid flat")
        mobile = normalize_phone(payload.contact_phone)
        if len(mobile) < 10:
            raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number")
        existing = (
            db.query(User)
            .filter(User.phone == mobile, User.id != user.id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=409, detail="This mobile number is already registered")
        user.phone = mobile
        user.flat_id = payload.flat_id
        user.resident_type = "IN_HOUSE_OWNER"

        if payload.vehicles:
            for vehicle in payload.vehicles:
                number = vehicle.number.strip().upper()
                if not number:
                    continue
                db.add(
                    Vehicle(
                        id=new_id(),
                        number=number,
                        type=vehicle.type or "Car",
                        color=vehicle.color,
                        flat_id=user.flat_id,
                    )
                )

    if user.role == "RESIDENT":
        flat_id = payload.flat_id or user.flat_id
        if not flat_id:
            raise HTTPException(status_code=400, detail="Please select your flat")
        flat = db.get(Flat, flat_id)
        if flat is None or flat.society_id != user.society_id:
            raise HTTPException(status_code=400, detail="Invalid flat")
        user.flat_id = flat_id

        if payload.contact_phone:
            mobile = normalize_phone(payload.contact_phone)
            if len(mobile) < 10:
                raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number")
            existing = (
                db.query(User)
                .filter(User.phone == mobile, User.id != user.id)
                .first()
            )
            if existing:
                raise HTTPException(status_code=409, detail="This mobile number is already registered")
            user.phone = mobile

        if payload.vehicles:
            for vehicle in payload.vehicles:
                number = vehicle.number.strip().upper()
                if not number:
                    continue
                db.add(
                    Vehicle(
                        id=new_id(),
                        number=number,
                        type=vehicle.type or "Car",
                        color=vehicle.color,
                        flat_id=user.flat_id,
                    )
                )

    contact = normalize_phone(payload.contact_phone) if payload.contact_phone else user.phone
    sync_directory(
        db,
        user,
        display_name=name,
        contact_phone=contact,
        show_in_directory=payload.show_in_directory,
    )

    db.commit()
    db.refresh(user)
    return {
        "ok": True,
        "access_token": create_access_token(user),
        "user": user_response(user),
    }


@router.patch("/profile", response_model=UserResponse)
def update_profile(
    payload: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.must_change_password:
        raise HTTPException(status_code=400, detail="Complete first-time setup first")

    if payload.name is not None:
        name = payload.name.strip()
        if len(name) < 2:
            raise HTTPException(status_code=400, detail="Enter your full name")
        user.name = name

    if payload.email is not None:
        user.email = payload.email.strip() or None

    contact = None
    if payload.contact_phone is not None:
        contact = normalize_phone(payload.contact_phone) if payload.contact_phone else user.phone

    if payload.flat_id is not None and user.role != "ADMIN":
        flat = db.get(Flat, payload.flat_id)
        if flat is None or flat.society_id != user.society_id:
            raise HTTPException(status_code=400, detail="Invalid flat")
        user.flat_id = payload.flat_id

    if user.flat_id:
        sync_directory(
            db,
            user,
            display_name=user.name,
            contact_phone=contact or user.phone,
            show_in_directory=payload.show_in_directory if payload.show_in_directory is not None else True,
        )

    db.commit()
    db.refresh(user)
    return user_response(user)


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.must_change_password:
        raise HTTPException(status_code=400, detail="Use account setup to set your first password")
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"ok": True, "access_token": create_access_token(user)}
