from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    phone: str
    password: str
    role: str


class LoginConfigResponse(BaseModel):
    bootstrap_mode: bool
    bootstrap_login_id: str = "Admin"


class ForgotPasswordRequest(BaseModel):
    phone: str
    role: str
    committee_role: str | None = None


class ForgotPasswordResponse(BaseModel):
    ok: bool
    message: str
    password: str
    must_change_password: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    redirect: str
    must_change_password: bool


class FlatResponse(BaseModel):
    id: str
    label: str
    floor: int
    unit: int
    is_merged: bool
    physical_units: str | None

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id: str
    email: str | None
    phone: str
    name: str
    role: str
    society_id: str
    flat_id: str | None
    flat_label: str | None
    resident_type: str | None
    committee_role: str | None
    tenant_owner_name: str | None = None
    tenant_owner_phone: str | None = None
    tenant_owner_flat_label: str | None = None
    is_main_admin: bool
    must_change_password: bool


class MeResponse(BaseModel):
    user: UserResponse


class CreateUserRequest(BaseModel):
    name: str
    phone: str
    email: str | None = None
    role: str
    resident_type: str | None = None
    committee_role: str | None = None
    flat_id: str | None = None
    tenant_owner_name: str | None = None
    tenant_owner_phone: str | None = None
    tenant_owner_flat_label: str | None = None


class CredentialsResponse(BaseModel):
    name: str
    phone: str
    password: str
    role: str
    resident_type: str | None
    committee_role: str | None
    flat_label: str | None
    must_change_password: bool


class CreateUserResponse(BaseModel):
    user: UserResponse
    credentials: CredentialsResponse


class UpdateUserLoginRequest(BaseModel):
    role: str
    resident_type: str | None = None
    committee_role: str | None = None
    flat_id: str | None = None
    tenant_owner_name: str | None = None
    tenant_owner_phone: str | None = None
    tenant_owner_flat_label: str | None = None


class BulkImportRowResult(BaseModel):
    row: int
    name: str
    phone: str
    ok: bool
    error: str | None = None
    password: str | None = None
    flat_label: str | None = None
    role: str | None = None


class BulkImportResponse(BaseModel):
    created: int
    failed: int
    results: list[BulkImportRowResult]


class CreateVisitorRequest(BaseModel):
    guest_name: str
    guest_phone: str | None = None
    purpose: str | None = None
    vehicle_no: str | None = None
    visit_date: str
    valid_from: str
    valid_until: str
    guest_type: str | None = "GUEST"


class VisitorResponse(BaseModel):
    id: str
    guest_name: str
    guest_phone: str | None
    purpose: str | None
    vehicle_no: str | None
    guest_type: str
    visit_date: str
    valid_from: str
    valid_until: str
    otp: str
    status: str
    flat_id: str
    flat_label: str | None = None
    created_by_name: str | None = None


class CreateDeliveryRequest(BaseModel):
    company: str
    description: str | None = None
    mode: str = "ALLOW_ENTRY"


class DeliveryResponse(BaseModel):
    id: str
    company: str
    description: str | None
    otp: str
    mode: str
    status: str
    flat_id: str
    flat_label: str | None = None
    created_by_name: str | None = None


class CreateNoticeRequest(BaseModel):
    title: str
    body: str
    pinned: bool | None = False


class NoticeResponse(BaseModel):
    id: str
    title: str
    body: str
    pinned: bool
    target_group: str | None
    society_id: str
    author_id: str
    author_name: str | None = None
    created_at: str


class StaffResponse(BaseModel):
    id: str
    name: str
    phone: str | None
    staff_type: str
    passcode: str
    active: bool
    flat_id: str
    flat_label: str | None = None


class CreateStaffRequest(BaseModel):
    name: str
    phone: str | None = None
    staff_type: str
    id_proof: str | None = None


class VehicleResponse(BaseModel):
    id: str
    number: str
    type: str
    color: str | None
    sticker_no: str | None
    flat_id: str
    flat_label: str | None = None
    owner_name: str | None = None
    owner_phone: str | None = None


class CreateVehicleRequest(BaseModel):
    number: str
    type: str | None = "Car"
    color: str | None = None
    sticker_no: str | None = None


class ComplaintResponse(BaseModel):
    id: str
    subject: str
    body: str
    category: str
    status: str
    flat_id: str
    flat_label: str | None = None
    user_name: str | None = None
    admin_note: str | None
    created_at: str


class CreateComplaintRequest(BaseModel):
    subject: str
    body: str
    category: str | None = "General"


class UpdateComplaintRequest(BaseModel):
    status: str | None = None
    admin_note: str | None = None


class SosResponse(BaseModel):
    id: str
    message: str | None
    status: str
    flat_label: str
    user_name: str | None = None
    user_phone: str | None = None
    created_at: str


class CreateSosRequest(BaseModel):
    message: str | None = None


class KidExitResponse(BaseModel):
    id: str
    child_name: str
    child_age: int | None
    status: str
    otp: str | None
    flat_label: str | None = None
    parent_name: str | None = None
    requested_at: str


class CreateKidExitRequest(BaseModel):
    child_name: str
    child_age: int | None = None


class GateLookupResponse(BaseModel):
    type: str
    record: dict


class EmergencyContactResponse(BaseModel):
    id: str
    name: str
    role: str
    phone: str


class AccountsSummaryResponse(BaseModel):
    total_collected: float
    total_expenses: float
    balance: float
    pending_bills: int
    flat_count: int


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class SetupVehicleInput(BaseModel):
    number: str
    type: str | None = "Car"
    color: str | None = None


class CompleteSetupRequest(BaseModel):
    current_password: str
    new_password: str
    name: str
    email: str | None = None
    contact_phone: str | None = None
    flat_id: str | None = None
    show_in_directory: bool = True
    vehicles: list[SetupVehicleInput] | None = None


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    contact_phone: str | None = None
    flat_id: str | None = None
    show_in_directory: bool | None = None


class RealtimeSummaryResponse(BaseModel):
    unread_notifications: int = 0
    pending_deliveries: int = 0
    pending_bills: int = 0
    open_complaints: int = 0
    pending_kids_exit: int = 0
    active_sos: int = 0
    pending_moves: int = 0
    visitors_today: int = 0
    server_time: str


class BillResponse(BaseModel):
    id: str
    flat_id: str
    flat_label: str | None = None
    month: str
    amount: float
    description: str | None
    status: str
    due_date: str
    paid_at: str | None = None
    transaction_id: str | None = None
    payment_method: str | None = None
    paid_by_name: str | None = None
    resident_name: str | None = None
    resident_type: str | None = None
    resident_phone: str | None = None


class CollectionSummaryResponse(BaseModel):
    month: str
    collected: float
    still_pending: float
    flats_paid: int
    flat_count: int


class CollectionDashboardResponse(BaseModel):
    summary: CollectionSummaryResponse
    rows: list[BillResponse]


class PayBillRequest(BaseModel):
    method: str = "UPI"
    reference: str | None = None


class RazorpayOrderResponse(BaseModel):
    key_id: str
    order_id: str
    amount: int
    currency: str = "INR"
    bill_id: str
    description: str
    society_name: str


class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class GenerateBillsRequest(BaseModel):
    month: str | None = None


class ExpenseResponse(BaseModel):
    id: str
    title: str
    category: str
    amount: float
    description: str | None
    paid_to: str | None
    expense_date: str
    receipt_ref: str | None
    recorded_by_name: str | None = None
    created_at: str


class CreateExpenseRequest(BaseModel):
    title: str
    category: str
    amount: float
    description: str | None = None
    paid_to: str | None = None
    expense_date: str
    receipt_ref: str | None = None


class TransactionResponse(BaseModel):
    id: str
    type: str
    amount: float
    description: str
    method: str
    reference: str | None
    flat_label: str | None = None
    created_at: str


class AmenityResponse(BaseModel):
    id: str
    name: str
    description: str | None
    open_time: str | None
    close_time: str | None


class CreateAmenityRequest(BaseModel):
    name: str
    description: str | None = None
    open_time: str | None = None
    close_time: str | None = None


class BookingResponse(BaseModel):
    id: str
    amenity_name: str | None = None
    flat_label: str | None = None
    slot_start: str
    slot_end: str
    status: str
    notes: str | None


class CreateBookingRequest(BaseModel):
    amenity_id: str
    slot_start: str
    slot_end: str
    notes: str | None = None


class PollOptionResponse(BaseModel):
    id: str
    text: str
    vote_count: int = 0


class PollResponse(BaseModel):
    id: str
    question: str
    ends_at: str
    options: list[PollOptionResponse]
    user_voted_option_id: str | None = None


class CreatePollRequest(BaseModel):
    question: str
    ends_at: str
    options: list[str]


class VotePollRequest(BaseModel):
    option_id: str


class EventResponse(BaseModel):
    id: str
    title: str
    body: str | None
    location: str | None
    starts_at: str
    ends_at: str | None


class CreateEventRequest(BaseModel):
    title: str
    body: str | None = None
    location: str | None = None
    starts_at: str
    ends_at: str | None = None


class DocumentResponse(BaseModel):
    id: str
    title: str
    category: str
    file_url: str | None
    body: str | None
    created_at: str


class CreateDocumentRequest(BaseModel):
    title: str
    category: str
    file_url: str | None = None
    body: str | None = None


class MoveRequestResponse(BaseModel):
    id: str
    type: str
    status: str
    flat_label: str | None = None
    user_name: str | None = None
    move_date: str
    notes: str | None
    created_at: str


class CreateMoveRequest(BaseModel):
    type: str
    move_date: str
    notes: str | None = None


class UpdateMoveRequest(BaseModel):
    status: str


class DirectoryResponse(BaseModel):
    id: str
    flat_label: str | None = None
    display_name: str
    phone: str | None
    show_in_directory: bool


class UpdateDirectoryRequest(BaseModel):
    display_name: str | None = None
    phone: str | None = None
    show_in_directory: bool | None = None


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    body: str
    read: bool
    created_at: str


class RateStaffRequest(BaseModel):
    staff_id: str
    rating: int
    review: str | None = None


class CreateEmergencyRequest(BaseModel):
    name: str
    role: str
    phone: str
