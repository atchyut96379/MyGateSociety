from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Society(Base):
    __tablename__ = "Society"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    association_name: Mapped[str] = mapped_column("associationName", String(255))
    address: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    total_flats: Mapped[int] = mapped_column("totalFlats", Integer, default=90)
    maintenance_amount_per_flat: Mapped[float] = mapped_column(
        "maintenanceAmountPerFlat", Float, default=1200
    )
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    flats: Mapped[list["Flat"]] = relationship(back_populates="society")
    users: Mapped[list["User"]] = relationship(back_populates="society")
    notices: Mapped[list["Notice"]] = relationship(back_populates="society")
    amenities: Mapped[list["Amenity"]] = relationship(back_populates="society")
    emergency_contacts: Mapped[list["EmergencyContact"]] = relationship(back_populates="society")
    documents: Mapped[list["Document"]] = relationship(back_populates="society")
    events: Mapped[list["Event"]] = relationship(back_populates="society")
    polls: Mapped[list["Poll"]] = relationship(back_populates="society")
    expenses: Mapped[list["SocietyExpense"]] = relationship(back_populates="society")
    transactions: Mapped[list["SocietyTransaction"]] = relationship(back_populates="society")


class Flat(Base):
    __tablename__ = "Flat"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    label: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    floor: Mapped[int] = mapped_column(Integer)
    unit: Mapped[int] = mapped_column(Integer)
    is_merged: Mapped[bool] = mapped_column("isMerged", Boolean, default=False)
    physical_units: Mapped[str | None] = mapped_column("physicalUnits", String(50), nullable=True)
    society_id: Mapped[str] = mapped_column(
        "societyId", String(32), ForeignKey("Society.id"), index=True
    )

    society: Mapped[Society] = relationship(back_populates="flats")
    users: Mapped[list["User"]] = relationship(back_populates="flat")
    visitors: Mapped[list["VisitorPass"]] = relationship(back_populates="flat")
    deliveries: Mapped[list["DeliveryPass"]] = relationship(back_populates="flat")
    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="flat")
    bills: Mapped[list["MaintenanceBill"]] = relationship(back_populates="flat")
    bookings: Mapped[list["AmenityBooking"]] = relationship(back_populates="flat")
    staff: Mapped[list["DomesticStaff"]] = relationship(back_populates="flat")
    complaints: Mapped[list["Complaint"]] = relationship(back_populates="flat")
    move_requests: Mapped[list["MoveRequest"]] = relationship(back_populates="flat")
    directory: Mapped["DirectoryEntry | None"] = relationship(back_populates="flat")
    kid_exits: Mapped[list["KidExitRequest"]] = relationship(back_populates="flat")
    transactions: Mapped[list["SocietyTransaction"]] = relationship(back_populates="flat")


class User(Base):
    __tablename__ = "User"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column("passwordHash", String(255))
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(50), default="RESIDENT", index=True)
    resident_type: Mapped[str | None] = mapped_column("residentType", String(50), nullable=True)
    committee_role: Mapped[str | None] = mapped_column("committeeRole", String(50), nullable=True)
    is_main_admin: Mapped[bool] = mapped_column("isMainAdmin", Boolean, default=False)
    must_change_password: Mapped[bool] = mapped_column("mustChangePassword", Boolean, default=True)
    tenant_owner_name: Mapped[str | None] = mapped_column("tenantOwnerName", String(255), nullable=True)
    tenant_owner_phone: Mapped[str | None] = mapped_column("tenantOwnerPhone", String(50), nullable=True)
    tenant_owner_flat_label: Mapped[str | None] = mapped_column(
        "tenantOwnerFlatLabel", String(50), nullable=True
    )
    flat_id: Mapped[str | None] = mapped_column(
        "flatId", String(32), ForeignKey("Flat.id"), nullable=True, index=True
    )
    society_id: Mapped[str] = mapped_column(
        "societyId", String(32), ForeignKey("Society.id"), index=True
    )
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    flat: Mapped[Flat | None] = relationship(back_populates="users")
    society: Mapped[Society] = relationship(back_populates="users")
    visitors_created: Mapped[list["VisitorPass"]] = relationship(back_populates="created_by")
    deliveries_created: Mapped[list["DeliveryPass"]] = relationship(back_populates="created_by")
    notices: Mapped[list["Notice"]] = relationship(back_populates="author")
    complaints: Mapped[list["Complaint"]] = relationship(back_populates="user")
    bookings: Mapped[list["AmenityBooking"]] = relationship(back_populates="user")
    staff_created: Mapped[list["DomesticStaff"]] = relationship(back_populates="created_by")
    sos_alerts: Mapped[list["SosAlert"]] = relationship(back_populates="user")
    poll_votes: Mapped[list["PollVote"]] = relationship(back_populates="user")
    move_requests: Mapped[list["MoveRequest"]] = relationship(back_populates="user")
    notifications: Mapped[list["ResidentNotification"]] = relationship(back_populates="user")
    push_subscriptions: Mapped[list["PushSubscription"]] = relationship(back_populates="user")
    kid_exit_requests: Mapped[list["KidExitRequest"]] = relationship(back_populates="parent")
    staff_ratings: Mapped[list["StaffRating"]] = relationship(back_populates="user")
    expenses_recorded: Mapped[list["SocietyExpense"]] = relationship(back_populates="recorded_by")
    transactions_recorded: Mapped[list["SocietyTransaction"]] = relationship(back_populates="recorded_by")


class VisitorPass(Base):
    __tablename__ = "VisitorPass"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    guest_name: Mapped[str] = mapped_column("guestName", String(255))
    guest_phone: Mapped[str | None] = mapped_column("guestPhone", String(50), nullable=True)
    purpose: Mapped[str | None] = mapped_column(String(500), nullable=True)
    vehicle_no: Mapped[str | None] = mapped_column("vehicleNo", String(50), nullable=True)
    guest_type: Mapped[str] = mapped_column("guestType", String(50), default="GUEST")
    visit_date: Mapped[datetime] = mapped_column("visitDate", DateTime)
    valid_from: Mapped[datetime] = mapped_column("validFrom", DateTime)
    valid_until: Mapped[datetime] = mapped_column("validUntil", DateTime)
    otp: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(50), default="APPROVED")
    flat_id: Mapped[str] = mapped_column(
        "flatId", String(32), ForeignKey("Flat.id"), index=True
    )
    created_by_id: Mapped[str] = mapped_column(
        "createdById", String(32), ForeignKey("User.id"), index=True
    )
    checked_in_at: Mapped[datetime | None] = mapped_column("checkedInAt", DateTime, nullable=True)
    checked_out_at: Mapped[datetime | None] = mapped_column("checkedOutAt", DateTime, nullable=True)
    gate_notes: Mapped[str | None] = mapped_column("gateNotes", String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    flat: Mapped[Flat] = relationship(back_populates="visitors")
    created_by: Mapped[User] = relationship(back_populates="visitors_created")

    __table_args__ = (Index("IX_VisitorPass_otp_status", "otp", "status"),)


class DeliveryPass(Base):
    __tablename__ = "DeliveryPass"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    company: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    otp: Mapped[str] = mapped_column(String(20))
    mode: Mapped[str] = mapped_column(String(50), default="ALLOW_ENTRY")
    status: Mapped[str] = mapped_column(String(50), default="PENDING")
    flat_id: Mapped[str] = mapped_column(
        "flatId", String(32), ForeignKey("Flat.id"), index=True
    )
    created_by_id: Mapped[str] = mapped_column(
        "createdById", String(32), ForeignKey("User.id"), index=True
    )
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    delivered_at: Mapped[datetime | None] = mapped_column("deliveredAt", DateTime, nullable=True)
    collected_at: Mapped[datetime | None] = mapped_column("collectedAt", DateTime, nullable=True)

    flat: Mapped[Flat] = relationship(back_populates="deliveries")
    created_by: Mapped[User] = relationship(back_populates="deliveries_created")

    __table_args__ = (Index("IX_DeliveryPass_otp_status", "otp", "status"),)


class Notice(Base):
    __tablename__ = "Notice"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(String(4000))
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    target_group: Mapped[str | None] = mapped_column("targetGroup", String(100), nullable=True)
    society_id: Mapped[str] = mapped_column(
        "societyId", String(32), ForeignKey("Society.id"), index=True
    )
    author_id: Mapped[str] = mapped_column(
        "authorId", String(32), ForeignKey("User.id"), index=True
    )
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    society: Mapped[Society] = relationship(back_populates="notices")
    author: Mapped[User] = relationship(back_populates="notices")


class Complaint(Base):
    __tablename__ = "Complaint"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    subject: Mapped[str] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(String(4000))
    category: Mapped[str] = mapped_column(String(100), default="General")
    status: Mapped[str] = mapped_column(String(50), default="OPEN", index=True)
    flat_id: Mapped[str] = mapped_column(
        "flatId", String(32), ForeignKey("Flat.id"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String(32), ForeignKey("User.id"), index=True
    )
    admin_note: Mapped[str | None] = mapped_column("adminNote", String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    flat: Mapped[Flat] = relationship(back_populates="complaints")
    user: Mapped[User] = relationship(back_populates="complaints")


class DomesticStaff(Base):
    __tablename__ = "DomesticStaff"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    staff_type: Mapped[str] = mapped_column("staffType", String(100))
    id_proof: Mapped[str | None] = mapped_column("idProof", String(255), nullable=True)
    photo_url: Mapped[str | None] = mapped_column("photoUrl", String(500), nullable=True)
    flat_id: Mapped[str] = mapped_column(
        "flatId", String(32), ForeignKey("Flat.id"), index=True
    )
    created_by_id: Mapped[str] = mapped_column(
        "createdById", String(32), ForeignKey("User.id"), index=True
    )
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    passcode: Mapped[str] = mapped_column(String(20), unique=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    flat: Mapped[Flat] = relationship(back_populates="staff")
    created_by: Mapped[User] = relationship(back_populates="staff_created")
    attendance: Mapped[list["StaffAttendance"]] = relationship(back_populates="staff")
    ratings: Mapped[list["StaffRating"]] = relationship(back_populates="staff")


class StaffAttendance(Base):
    __tablename__ = "StaffAttendance"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    staff_id: Mapped[str] = mapped_column(
        "staffId", String(32), ForeignKey("DomesticStaff.id"), index=True
    )
    date: Mapped[datetime] = mapped_column(DateTime, index=True)
    check_in: Mapped[datetime | None] = mapped_column("checkIn", DateTime, nullable=True)
    check_out: Mapped[datetime | None] = mapped_column("checkOut", DateTime, nullable=True)
    verified_by: Mapped[str | None] = mapped_column("verifiedBy", String(100), nullable=True)

    staff: Mapped[DomesticStaff] = relationship(back_populates="attendance")


class Vehicle(Base):
    __tablename__ = "Vehicle"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    number: Mapped[str] = mapped_column(String(50), index=True)
    type: Mapped[str] = mapped_column("type", String(50), default="Car")
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sticker_no: Mapped[str | None] = mapped_column("stickerNo", String(50), nullable=True)
    flat_id: Mapped[str] = mapped_column(
        "flatId", String(32), ForeignKey("Flat.id"), index=True
    )
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    flat: Mapped[Flat] = relationship(back_populates="vehicles")


class MaintenanceBill(Base):
    __tablename__ = "MaintenanceBill"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    flat_id: Mapped[str] = mapped_column(
        "flatId", String(32), ForeignKey("Flat.id"), index=True
    )
    month: Mapped[str] = mapped_column(String(20))
    amount: Mapped[float] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="UNPAID", index=True)
    due_date: Mapped[datetime] = mapped_column("dueDate", DateTime)
    paid_at: Mapped[datetime | None] = mapped_column("paidAt", DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    flat: Mapped[Flat] = relationship(back_populates="bills")
    transaction: Mapped["SocietyTransaction | None"] = relationship(back_populates="bill")

    __table_args__ = (UniqueConstraint("flatId", "month", name="UQ_MaintenanceBill_flatId_month"),)


class Amenity(Base):
    __tablename__ = "Amenity"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    open_time: Mapped[str | None] = mapped_column("openTime", String(20), nullable=True)
    close_time: Mapped[str | None] = mapped_column("closeTime", String(20), nullable=True)
    society_id: Mapped[str] = mapped_column(
        "societyId", String(32), ForeignKey("Society.id"), index=True
    )

    society: Mapped[Society] = relationship(back_populates="amenities")
    bookings: Mapped[list["AmenityBooking"]] = relationship(back_populates="amenity")


class AmenityBooking(Base):
    __tablename__ = "AmenityBooking"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    amenity_id: Mapped[str] = mapped_column(
        "amenityId", String(32), ForeignKey("Amenity.id"), index=True
    )
    flat_id: Mapped[str] = mapped_column(
        "flatId", String(32), ForeignKey("Flat.id"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String(32), ForeignKey("User.id"), index=True
    )
    slot_start: Mapped[datetime] = mapped_column("slotStart", DateTime)
    slot_end: Mapped[datetime] = mapped_column("slotEnd", DateTime)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", index=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    amenity: Mapped[Amenity] = relationship(back_populates="bookings")
    flat: Mapped[Flat] = relationship(back_populates="bookings")
    user: Mapped[User] = relationship(back_populates="bookings")


class EmergencyContact(Base):
    __tablename__ = "EmergencyContact"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(50))
    society_id: Mapped[str] = mapped_column(
        "societyId", String(32), ForeignKey("Society.id"), index=True
    )

    society: Mapped[Society] = relationship(back_populates="emergency_contacts")


class DirectoryEntry(Base):
    __tablename__ = "DirectoryEntry"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    flat_id: Mapped[str] = mapped_column(
        "flatId", String(32), ForeignKey("Flat.id"), unique=True
    )
    display_name: Mapped[str] = mapped_column("displayName", String(255))
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    show_in_directory: Mapped[bool] = mapped_column("showInDirectory", Boolean, default=True)

    flat: Mapped[Flat] = relationship(back_populates="directory")


class Document(Base):
    __tablename__ = "Document"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    category: Mapped[str] = mapped_column(String(100))
    file_url: Mapped[str | None] = mapped_column("fileUrl", String(500), nullable=True)
    body: Mapped[str | None] = mapped_column(String(4000), nullable=True)
    society_id: Mapped[str] = mapped_column(
        "societyId", String(32), ForeignKey("Society.id"), index=True
    )
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    society: Mapped[Society] = relationship(back_populates="documents")


class Event(Base):
    __tablename__ = "Event"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    body: Mapped[str | None] = mapped_column(String(4000), nullable=True)
    location: Mapped[str | None] = mapped_column(String(500), nullable=True)
    starts_at: Mapped[datetime] = mapped_column("startsAt", DateTime, index=True)
    ends_at: Mapped[datetime | None] = mapped_column("endsAt", DateTime, nullable=True)
    society_id: Mapped[str] = mapped_column(
        "societyId", String(32), ForeignKey("Society.id"), index=True
    )
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    society: Mapped[Society] = relationship(back_populates="events")


class Poll(Base):
    __tablename__ = "Poll"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    question: Mapped[str] = mapped_column(String(1000))
    ends_at: Mapped[datetime] = mapped_column("endsAt", DateTime)
    society_id: Mapped[str] = mapped_column(
        "societyId", String(32), ForeignKey("Society.id"), index=True
    )
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    society: Mapped[Society] = relationship(back_populates="polls")
    options: Mapped[list["PollOption"]] = relationship(back_populates="poll")
    votes: Mapped[list["PollVote"]] = relationship(back_populates="poll")


class PollOption(Base):
    __tablename__ = "PollOption"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    text: Mapped[str] = mapped_column(String(500))
    poll_id: Mapped[str] = mapped_column(
        "pollId", String(32), ForeignKey("Poll.id"), index=True
    )

    poll: Mapped[Poll] = relationship(back_populates="options")
    votes: Mapped[list["PollVote"]] = relationship(back_populates="option")


class PollVote(Base):
    __tablename__ = "PollVote"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    poll_id: Mapped[str] = mapped_column("pollId", String(32), ForeignKey("Poll.id"))
    option_id: Mapped[str] = mapped_column(
        "optionId", String(32), ForeignKey("PollOption.id"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String(32), ForeignKey("User.id"), index=True
    )

    poll: Mapped[Poll] = relationship(back_populates="votes")
    option: Mapped[PollOption] = relationship(back_populates="votes")
    user: Mapped[User] = relationship(back_populates="poll_votes")

    __table_args__ = (UniqueConstraint("pollId", "userId", name="UQ_PollVote_pollId_userId"),)


class MoveRequest(Base):
    __tablename__ = "MoveRequest"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    type: Mapped[str] = mapped_column("type", String(50))
    status: Mapped[str] = mapped_column(String(50), default="REQUESTED", index=True)
    flat_id: Mapped[str] = mapped_column(
        "flatId", String(32), ForeignKey("Flat.id"), index=True
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String(32), ForeignKey("User.id"), index=True
    )
    move_date: Mapped[datetime] = mapped_column("moveDate", DateTime)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    flat: Mapped[Flat] = relationship(back_populates="move_requests")
    user: Mapped[User] = relationship(back_populates="move_requests")


class SosAlert(Base):
    __tablename__ = "SosAlert"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    message: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", index=True)
    user_id: Mapped[str] = mapped_column(
        "userId", String(32), ForeignKey("User.id"), index=True
    )
    flat_label: Mapped[str] = mapped_column("flatLabel", String(50))
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column("resolvedAt", DateTime, nullable=True)

    user: Mapped[User] = relationship(back_populates="sos_alerts")


class KidExitRequest(Base):
    __tablename__ = "KidExitRequest"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    child_name: Mapped[str] = mapped_column("childName", String(255))
    child_age: Mapped[int | None] = mapped_column("childAge", Integer, nullable=True)
    flat_id: Mapped[str] = mapped_column(
        "flatId", String(32), ForeignKey("Flat.id"), index=True
    )
    parent_id: Mapped[str] = mapped_column(
        "parentId", String(32), ForeignKey("User.id"), index=True
    )
    status: Mapped[str] = mapped_column(String(50), default="PENDING_APPROVAL", index=True)
    otp: Mapped[str | None] = mapped_column(String(20), nullable=True)
    requested_at: Mapped[datetime] = mapped_column("requestedAt", DateTime, default=datetime.utcnow)
    approved_at: Mapped[datetime | None] = mapped_column("approvedAt", DateTime, nullable=True)
    checked_out_at: Mapped[datetime | None] = mapped_column("checkedOutAt", DateTime, nullable=True)
    gate_notes: Mapped[str | None] = mapped_column("gateNotes", String(1000), nullable=True)

    flat: Mapped[Flat] = relationship(back_populates="kid_exits")
    parent: Mapped[User] = relationship(back_populates="kid_exit_requests")


class StaffRating(Base):
    __tablename__ = "StaffRating"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    staff_id: Mapped[str] = mapped_column("staffId", String(32), ForeignKey("DomesticStaff.id"))
    user_id: Mapped[str] = mapped_column(
        "userId", String(32), ForeignKey("User.id"), index=True
    )
    rating: Mapped[int] = mapped_column(Integer)
    review: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    staff: Mapped[DomesticStaff] = relationship(back_populates="ratings")
    user: Mapped[User] = relationship(back_populates="staff_ratings")

    __table_args__ = (UniqueConstraint("staffId", "userId", name="UQ_StaffRating_staffId_userId"),)


class SocietyExpense(Base):
    __tablename__ = "SocietyExpense"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    category: Mapped[str] = mapped_column(String(100))
    amount: Mapped[float] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    paid_to: Mapped[str | None] = mapped_column("paidTo", String(255), nullable=True)
    expense_date: Mapped[datetime] = mapped_column("expenseDate", DateTime)
    receipt_ref: Mapped[str | None] = mapped_column("receiptRef", String(255), nullable=True)
    receipt_image: Mapped[str | None] = mapped_column("receiptImage", String(500), nullable=True)
    society_id: Mapped[str] = mapped_column(
        "societyId", String(32), ForeignKey("Society.id"), index=True
    )
    recorded_by_id: Mapped[str] = mapped_column(
        "recordedById", String(32), ForeignKey("User.id"), index=True
    )
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    society: Mapped[Society] = relationship(back_populates="expenses")
    recorded_by: Mapped[User] = relationship(back_populates="expenses_recorded")
    transaction: Mapped["SocietyTransaction | None"] = relationship(back_populates="expense")


class SocietyTransaction(Base):
    __tablename__ = "SocietyTransaction"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    type: Mapped[str] = mapped_column(String(50))
    amount: Mapped[float] = mapped_column(Float)
    description: Mapped[str] = mapped_column(String(1000))
    method: Mapped[str] = mapped_column(String(50), default="UPI")
    reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    society_id: Mapped[str] = mapped_column(
        "societyId", String(32), ForeignKey("Society.id"), index=True
    )
    flat_id: Mapped[str | None] = mapped_column(
        "flatId", String(32), ForeignKey("Flat.id"), nullable=True, index=True
    )
    bill_id: Mapped[str | None] = mapped_column(
        "billId", String(32), ForeignKey("MaintenanceBill.id"), unique=True, nullable=True
    )
    expense_id: Mapped[str | None] = mapped_column(
        "expenseId", String(32), ForeignKey("SocietyExpense.id"), unique=True, nullable=True
    )
    recorded_by_id: Mapped[str] = mapped_column(
        "recordedById", String(32), ForeignKey("User.id"), index=True
    )
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    society: Mapped[Society] = relationship(back_populates="transactions")
    flat: Mapped[Flat | None] = relationship(back_populates="transactions")
    bill: Mapped[MaintenanceBill | None] = relationship(back_populates="transaction")
    expense: Mapped[SocietyExpense | None] = relationship(back_populates="transaction")
    recorded_by: Mapped[User] = relationship(back_populates="transactions_recorded")


class ResidentNotification(Base):
    __tablename__ = "ResidentNotification"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column("userId", String(32), ForeignKey("User.id"))
    type: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(String(2000))
    dedupe_key: Mapped[str | None] = mapped_column("dedupeKey", String(255), nullable=True)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="notifications")

    __table_args__ = (UniqueConstraint("userId", "dedupeKey", name="UQ_ResidentNotification_userId_dedupeKey"),)


class PushSubscription(Base):
    __tablename__ = "PushSubscription"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        "userId", String(32), ForeignKey("User.id"), index=True
    )
    endpoint: Mapped[str] = mapped_column(String(500), unique=True)
    p256dh: Mapped[str] = mapped_column(String(500))
    auth: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column("createdAt", DateTime, default=datetime.utcnow)

    user: Mapped[User] = relationship(back_populates="push_subscriptions")
