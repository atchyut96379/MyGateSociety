"""Wipe all society data and re-seed from scratch."""

from sqlalchemy.orm import Session

from .models import (
    Amenity,
    AmenityBooking,
    Complaint,
    DeliveryPass,
    DirectoryEntry,
    Document,
    DomesticStaff,
    EmergencyContact,
    Event,
    Flat,
    KidExitRequest,
    MaintenanceBill,
    MoveRequest,
    Notice,
    Poll,
    PollOption,
    PollVote,
    PushSubscription,
    ResidentNotification,
    Society,
    SocietyExpense,
    SocietyTransaction,
    SosAlert,
    StaffAttendance,
    StaffRating,
    User,
    Vehicle,
    VisitorPass,
)

# Delete children before parents (SQL Server FK-safe order).
CLEAR_ORDER = [
    ResidentNotification,
    PushSubscription,
    PollVote,
    PollOption,
    Poll,
    StaffRating,
    StaffAttendance,
    SocietyTransaction,
    SocietyExpense,
    MaintenanceBill,
    AmenityBooking,
    KidExitRequest,
    SosAlert,
    MoveRequest,
    Complaint,
    Document,
    Event,
    DirectoryEntry,
    DomesticStaff,
    Vehicle,
    DeliveryPass,
    VisitorPass,
    Notice,
    EmergencyContact,
    Amenity,
    User,
    Flat,
    Society,
]


def reset_all_data(db: Session) -> None:
    for model in CLEAR_ORDER:
        db.query(model).delete(synchronize_session=False)
    db.commit()
