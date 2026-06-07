export type Role = "RESIDENT" | "SECURITY" | "ADMIN" | "COMMITTEE";

export interface User {
  id: string;
  email: string | null;
  phone: string;
  name: string;
  role: Role;
  society_id: string;
  flat_id: string | null;
  flat_label: string | null;
  resident_type: string | null;
  committee_role: string | null;
  tenant_owner_name?: string | null;
  tenant_owner_phone?: string | null;
  tenant_owner_flat_label?: string | null;
  is_main_admin: boolean;
  must_change_password: boolean;
}

export interface Flat {
  id: string;
  label: string;
  floor: number;
  unit: number;
  is_merged: boolean;
  physical_units: string | null;
}

export interface Visitor {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  purpose: string | null;
  vehicle_no: string | null;
  guest_type: string;
  visit_date: string;
  valid_from: string;
  valid_until: string;
  otp: string;
  status: string;
  flat_id: string;
  flat_label: string | null;
  created_by_name: string | null;
}

export interface Delivery {
  id: string;
  company: string;
  description: string | null;
  otp: string;
  mode: string;
  status: string;
  flat_id: string;
  flat_label: string | null;
  created_by_name: string | null;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  target_group: string | null;
  society_id: string;
  author_id: string;
  author_name: string | null;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  redirect: string;
  must_change_password: boolean;
}

export interface CreateUserResponse {
  user: User;
  credentials: {
    name: string;
    phone: string;
    password: string;
    role: string;
    resident_type: string | null;
    committee_role: string | null;
    flat_label: string | null;
    must_change_password: boolean;
  };
}

export interface Staff {
  id: string;
  name: string;
  phone: string | null;
  staff_type: string;
  passcode: string;
  active: boolean;
  flat_id: string;
  flat_label: string | null;
}

export interface Vehicle {
  id: string;
  number: string;
  type: string;
  color: string | null;
  sticker_no: string | null;
  flat_id: string;
  flat_label: string | null;
  owner_name: string | null;
  owner_phone: string | null;
}

export interface Complaint {
  id: string;
  subject: string;
  body: string;
  category: string;
  status: string;
  flat_id: string;
  flat_label: string | null;
  user_name: string | null;
  admin_note: string | null;
  created_at: string;
}

export interface SosAlert {
  id: string;
  message: string | null;
  status: string;
  flat_label: string;
  user_name: string | null;
  user_phone: string | null;
  created_at: string;
}

export interface KidExit {
  id: string;
  child_name: string;
  child_age: number | null;
  status: string;
  otp: string | null;
  flat_label: string | null;
  parent_name: string | null;
  requested_at: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
}

export interface AccountsSummary {
  total_collected: number;
  total_expenses: number;
  balance: number;
  pending_bills: number;
  flat_count: number;
}

export interface GateLookup {
  type: string;
  record: Record<string, unknown>;
}

export interface Bill {
  id: string;
  flat_id: string;
  flat_label: string | null;
  month: string;
  amount: number;
  description: string | null;
  status: string;
  due_date: string;
  paid_at: string | null;
  transaction_id?: string | null;
  payment_method?: string | null;
  paid_by_name?: string | null;
  resident_name?: string | null;
  resident_type?: string | null;
  resident_phone?: string | null;
}

export interface CollectionSummary {
  month: string;
  collected: number;
  still_pending: number;
  flats_paid: number;
  flat_count: number;
}

export interface CollectionDashboard {
  summary: CollectionSummary;
  rows: Bill[];
}

export interface SetupVehicleInput {
  number: string;
  type?: string;
  color?: string;
}

export interface RazorpayOrder {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  bill_id: string;
  description: string;
  society_name: string;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentConfig {
  enabled: boolean;
  mode: string;
  webhook_configured: boolean;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  description: string | null;
  paid_to: string | null;
  expense_date: string;
  receipt_ref: string | null;
  recorded_by_name: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  method: string;
  reference: string | null;
  flat_label: string | null;
  created_at: string;
}

export interface Amenity {
  id: string;
  name: string;
  description: string | null;
  open_time: string | null;
  close_time: string | null;
}

export interface Booking {
  id: string;
  amenity_name: string | null;
  flat_label: string | null;
  slot_start: string;
  slot_end: string;
  status: string;
  notes: string | null;
}

export interface PollOption {
  id: string;
  text: string;
  vote_count: number;
}

export interface Poll {
  id: string;
  question: string;
  ends_at: string;
  options: PollOption[];
  user_voted_option_id: string | null;
}

export interface SocietyEvent {
  id: string;
  title: string;
  body: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
}

export interface Document {
  id: string;
  title: string;
  category: string;
  file_url: string | null;
  body: string | null;
  created_at: string;
}

export interface MoveRequest {
  id: string;
  type: string;
  status: string;
  flat_label: string | null;
  user_name: string | null;
  move_date: string;
  notes: string | null;
  created_at: string;
}

export interface DirectoryEntry {
  id: string;
  flat_label: string | null;
  display_name: string;
  phone: string | null;
  show_in_directory: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface RealtimeSummary {
  unread_notifications: number;
  pending_deliveries: number;
  pending_bills: number;
  open_complaints: number;
  pending_kids_exit: number;
  active_sos: number;
  pending_moves: number;
  visitors_today: number;
  server_time: string;
}

export interface CompleteSetupResponse {
  ok: boolean;
  access_token: string;
  user: User;
}

export interface BulkImportRowResult {
  row: number;
  name: string;
  phone: string;
  ok: boolean;
  error?: string | null;
  password?: string | null;
  flat_label?: string | null;
  role?: string | null;
}

export interface BulkImportResponse {
  created: number;
  failed: number;
  results: BulkImportRowResult[];
}

export interface GateLogEntry {
  type: string;
  id: string;
  name: string;
  flat_label: string | null;
  check_in: string | null;
  check_out: string | null;
  status: string;
  detail: string | null;
}

export interface DailyGateLogs {
  date: string;
  visitors: GateLogEntry[];
  staff: GateLogEntry[];
  deliveries: GateLogEntry[];
}

export interface StaffAttendanceEntry {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_type: string;
  flat_label: string | null;
  check_in: string | null;
  check_out: string | null;
}
