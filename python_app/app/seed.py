import sys

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from .config import settings
from .constants import SECRETARY_LOGIN_ID
from .database import Base, SessionLocal, engine
from . import models as _models  # noqa: F401 — register all tables
from .models import Amenity, EmergencyContact, Flat, Society, User
from .reset_data import reset_all_data
from .security import hash_password
from .utils import new_id


def generate_flat_definitions():
    flats = []
    for floor in range(1, 6):
        logical_unit = 0
        for door in range(1, 20):
            if door == 10:
                continue
            logical_unit += 1
            if door == 9:
                low = floor * 100 + 9
                high = floor * 100 + 10
                flats.append(
                    {
                        "label": f"{low}/{high}",
                        "floor": floor,
                        "unit": logical_unit,
                        "is_merged": True,
                        "physical_units": f"{low},{high}",
                    }
                )
                continue
            flats.append(
                {
                    "label": str(floor * 100 + door),
                    "floor": floor,
                    "unit": logical_unit,
                    "is_merged": False,
                    "physical_units": None,
                }
            )
    return flats


def ensure_database_exists():
    url = make_url(settings.database_url)
    database = url.database
    if not database or not url.drivername.startswith("mssql"):
        return

    master_engine = create_engine(url.set(database="master"), pool_pre_ping=True)
    escaped_database = database.replace("]", "]]")
    with master_engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        exists = conn.execute(
            text("SELECT DB_ID(:database_name)"),
            {"database_name": database},
        ).scalar()
        if exists is None:
            conn.execute(text(f"CREATE DATABASE [{escaped_database}]"))


def sync_flats(db, society: Society) -> int:
    expected = generate_flat_definitions()
    existing = db.query(Flat).filter(Flat.society_id == society.id).all()
    by_floor_unit = {(f.floor, f.unit): f for f in existing}
    by_label = {f.label: f for f in existing}

    for defn in expected:
        key = (defn["floor"], defn["unit"])
        flat = by_floor_unit.get(key)
        if flat is None:
            hyphen_label = defn["label"].replace("/", "-")
            flat = by_label.get(defn["label"]) or by_label.get(hyphen_label)
            if flat is None and defn["is_merged"]:
                for old in existing:
                    if old.is_merged and old.floor == defn["floor"]:
                        flat = old
                        break

        if flat is None:
            flat = Flat(id=new_id(), society_id=society.id, **defn)
            db.add(flat)
        else:
            flat.label = defn["label"]
            flat.floor = defn["floor"]
            flat.unit = defn["unit"]
            flat.is_merged = defn["is_merged"]
            flat.physical_units = defn["physical_units"]

    db.flush()
    return db.query(Flat).filter(Flat.society_id == society.id).count()


def seed_fresh(db) -> None:
    society = Society(
        id=new_id(),
        name="Marvel Rocks Society",
        association_name="Marvel Rocks",
        address="Marvel Rocks, Hyderabad",
        total_flats=90,
        maintenance_amount_per_flat=1200,
    )
    db.add(society)
    db.flush()

    flat_count = sync_flats(db, society)
    society.total_flats = flat_count

    db.add(
        User(
            id=new_id(),
            phone=SECRETARY_LOGIN_ID,
            email=None,
            name="Secretary",
            role="ADMIN",
            password_hash=hash_password("admin"),
            committee_role="SECRETARY",
            is_main_admin=True,
            must_change_password=True,
            society_id=society.id,
        )
    )

    db.add_all(
        [
            EmergencyContact(
                id=new_id(),
                name="Society Office",
                role="Administration",
                phone="—",
                society_id=society.id,
            ),
            EmergencyContact(
                id=new_id(),
                name="Local Police",
                role="Emergency",
                phone="100",
                society_id=society.id,
            ),
            EmergencyContact(
                id=new_id(),
                name="Ambulance",
                role="Medical",
                phone="108",
                society_id=society.id,
            ),
            EmergencyContact(
                id=new_id(),
                name="Fire",
                role="Emergency",
                phone="101",
                society_id=society.id,
            ),
        ]
    )

    db.add_all(
        [
            Amenity(
                id=new_id(),
                name="Clubhouse",
                description="Community hall & meetings",
                open_time="06:00",
                close_time="22:00",
                society_id=society.id,
            ),
            Amenity(
                id=new_id(),
                name="Swimming Pool",
                description="Residents only",
                open_time="07:00",
                close_time="20:00",
                society_id=society.id,
            ),
            Amenity(
                id=new_id(),
                name="Gym",
                description="Fitness centre",
                open_time="05:00",
                close_time="21:00",
                society_id=society.id,
            ),
        ]
    )


def seed(full_reset: bool = False):
    try:
        ensure_database_exists()
    except Exception as exc:
        raise SystemExit(
            "Cannot connect to SQL Server.\n"
            "  Check DATABASE_URL in python_app/.env and ensure SQL Server is running.\n"
            f"\nOriginal error: {exc}"
        ) from exc

    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if full_reset:
            reset_all_data(db)
            seed_fresh(db)
        elif db.query(Society).count() == 0:
            seed_fresh(db)
        else:
            society = db.query(Society).first()
            if society:
                sync_flats(db, society)

        db.commit()
        flat_count = db.query(Flat).count()
        print("Society: Marvel Rocks Society")
        print(f"Flats: {flat_count}")
        print("")
        print("Initial Secretary login:")
        print(f"  Login ID: {SECRETARY_LOGIN_ID}")
        print("  Password: admin")
        print("  Role:     Secretary (Main Admin)")
        if full_reset:
            print("")
            print("All data reset. Complete profile setup, then add users from Secretary module.")
    finally:
        db.close()


if __name__ == "__main__":
    seed(full_reset="--reset" in sys.argv)
