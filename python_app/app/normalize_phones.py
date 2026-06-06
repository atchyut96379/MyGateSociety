"""One-off / maintenance: store all mobiles as 10 digits and drop duplicate resident rows."""

from sqlalchemy.orm import Session

from .models import User
from .security import normalize_phone


def normalize_all_phones(db: Session) -> int:
    changed = 0
    users = db.query(User).order_by(User.is_main_admin.desc(), User.created_at).all()

    by_digits: dict[str, list[User]] = {}
    for user in users:
        if user.phone.lower() == "admin":
            continue
        digits = normalize_phone(user.phone)
        if not digits or len(digits) < 10:
            continue
        by_digits.setdefault(digits, []).append(user)

    for digits, group in by_digits.items():
        keeper = next((u for u in group if u.is_main_admin), group[0])
        for user in group:
            if user.id == keeper.id:
                continue
            db.delete(user)
            changed += 1
        db.flush()
        if keeper.phone != digits:
            keeper.phone = digits
            changed += 1

    return changed


def main() -> None:
    from .database import SessionLocal

    db = SessionLocal()
    try:
        n = normalize_all_phones(db)
        db.commit()
        print(f"Normalized {n} phone record(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
