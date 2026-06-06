from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from sqlalchemy import func, or_

from .config import settings
from .constants import SECRETARY_LOGIN_ID
from .database import get_db
from .models import User

bearer_scheme = HTTPBearer(auto_error=False)


def normalize_phone(phone: str) -> str:
    """Return digits only; Indian mobiles are stored and matched as 10 digits."""
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) > 10:
        return digits[-10:]
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    return digits


def phone_match_filters(digits: str):
    """Match 10-digit mobiles stored with or without a leading 0."""
    ten = normalize_phone(digits)
    return or_(User.phone == ten, User.phone == f"0{ten}")


def resolve_login_identifier(login: str) -> tuple[str, str]:
    """Return (lookup_key, lookup_mode) where mode is 'phone' or 'login_id'."""
    stripped = login.strip()
    digits = normalize_phone(stripped)
    if digits:
        return digits, "phone"
    return stripped, "login_id"


def find_user_by_login(db: Session, login: str) -> User | None:
    key, mode = resolve_login_identifier(login)
    if mode == "phone":
        return db.query(User).filter(phone_match_filters(key)).first()
    return (
        db.query(User)
        .filter(func.lower(User.phone) == key.lower())
        .first()
    )


def find_user_for_role_login(db: Session, login: str, role: str) -> User | None:
    """Resolve login when the same digits may exist on more than one account."""
    key, mode = resolve_login_identifier(login)
    if mode != "phone":
        return find_user_by_login(db, login)

    candidates = db.query(User).filter(phone_match_filters(key)).all()
    if not candidates:
        return None
    if role == "ADMIN":
        return next((u for u in candidates if u.is_main_admin), None)
    return next((u for u in candidates if u.role == role), None)


def is_bootstrap_secretary(user: User) -> bool:
    return (
        user.is_main_admin
        and user.phone.lower() == SECRETARY_LOGIN_ID.lower()
    )


def secretary_bootstrap_pending(db: Session) -> bool:
    secretary = (
        db.query(User)
        .filter(User.is_main_admin == True)  # noqa: E712 — SQL Server bit column
        .first()
    )
    if secretary is None:
        return True
    return is_bootstrap_secretary(secretary) and secretary.must_change_password


def is_bootstrap_login_input(login: str) -> bool:
    stripped = login.strip()
    if not stripped:
        return False
    _, mode = resolve_login_identifier(stripped)
    if mode == "phone":
        return False
    return stripped.lower() == SECRETARY_LOGIN_ID.lower()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_minutes
    )
    payload: dict[str, Any] = {
        "sub": user.id,
        "phone": user.phone,
        "role": user.role,
        "societyId": user.society_id,
        "flatId": user.flat_id,
        "mustChangePassword": user.must_change_password,
        "isMainAdmin": user.is_main_admin,
        "committeeRole": user.committee_role,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from exc

    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user


def require_roles(*roles: str):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return dependency


def require_main_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_main_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the Secretary can perform this action",
        )
    return user


def require_secretary_ready(user: User = Depends(require_main_admin)) -> User:
    if user.must_change_password:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Complete your profile and password setup before managing users",
        )
    return user
