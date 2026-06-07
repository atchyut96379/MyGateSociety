import type {
  AccountsSummary,
  Amenity,
  Bill,
  CollectionDashboard,
  RazorpayOrder,
  RazorpayPaymentResponse,
  SetupVehicleInput,
  Booking,
  Complaint,
  BulkImportResponse,
  CreateUserResponse,
  DailyGateLogs,
  StaffAttendanceEntry,
  Delivery,
  DirectoryEntry,
  Document,
  EmergencyContact,
  Expense,
  Flat,
  GateLookup,
  KidExit,
  CompleteSetupResponse,
  LoginResponse,
  MoveRequest,
  RealtimeSummary,
  Notice,
  Notification,
  Poll,
  SosAlert,
  SocietyEvent,
  Staff,
  Transaction,
  User,
  Vehicle,
  Visitor,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 20_000;

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        408,
        "Server is not responding. Check that the API is running (python_app/dev.ps1) and try again."
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data.detail)
          ? data.detail.map((d: { msg?: string }) => d.msg).join(", ")
          : data.error ?? res.statusText ?? "Request failed";
    throw new ApiError(res.status, message);
  }

  return data as T;
}

export const api = {
  health() {
    return request<{ ok: boolean; service: string }>("/health", {}, null, 10_000);
  },

  loginConfig() {
    return request<{ bootstrap_mode: boolean; bootstrap_login_id: string }>(
      "/auth/login-config",
      {}
    );
  },

  login(phone: string, password: string, role: string) {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password, role }),
    });
  },

  forgotPassword(body: { phone: string; role: string; committee_role?: string }) {
    return request<{ ok: boolean; message: string; password: string; must_change_password: boolean }>(
      "/auth/forgot-password",
      { method: "POST", body: JSON.stringify(body) }
    );
  },

  me(token: string) {
    return request<{ user: User }>("/auth/me", {}, token);
  },

  flats(token: string) {
    return request<Flat[]>("/flats", {}, token);
  },

  users(token: string) {
    return request<User[]>("/users", {}, token);
  },

  user(token: string, userId: string) {
    return request<User>(`/users/${userId}`, {}, token);
  },

  updateUserRole(token: string, userId: string, body: Record<string, unknown>) {
    return request<User>(`/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token);
  },

  updateUserLogin(token: string, userId: string, body: Record<string, unknown>) {
    return request<CreateUserResponse>(`/users/${userId}/login`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token);
  },

  createUser(token: string, body: Record<string, unknown>) {
    return request<CreateUserResponse>("/users", {
      method: "POST",
      body: JSON.stringify(body),
    }, token);
  },

  async downloadUserImportTemplate(token: string) {
    const res = await fetch(`${API_BASE}/users/bulk-template`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new ApiError(res.status, "Could not download template");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-import-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  },

  async importUsers(token: string, file: File) {
    const file_base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== "string") {
          reject(new ApiError(400, "Could not read the Excel file"));
          return;
        }
        const encoded = dataUrl.split(",")[1];
        if (!encoded) {
          reject(new ApiError(400, "Could not read the Excel file"));
          return;
        }
        resolve(encoded);
      };
      reader.onerror = () => reject(new ApiError(400, "Could not read the Excel file"));
      reader.readAsDataURL(file);
    });
    return request<BulkImportResponse>(
      "/users/bulk-json",
      {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          file_base64,
        }),
      },
      token,
      120_000
    );
  },

  visitors(token: string) {
    return request<Visitor[]>("/visitors", {}, token);
  },

  createVisitor(token: string, body: Record<string, unknown>) {
    return request<Visitor>("/visitors", {
      method: "POST",
      body: JSON.stringify(body),
    }, token);
  },

  deliveries(token: string) {
    return request<Delivery[]>("/deliveries", {}, token);
  },

  createDelivery(token: string, body: Record<string, unknown>) {
    return request<Delivery>("/deliveries", {
      method: "POST",
      body: JSON.stringify(body),
    }, token);
  },

  notices(token: string) {
    return request<Notice[]>("/notices", {}, token);
  },

  createNotice(token: string, body: { title: string; body: string; pinned?: boolean }) {
    return request<Notice>("/notices", {
      method: "POST",
      body: JSON.stringify(body),
    }, token);
  },

  gateLookup(token: string, otp: string) {
    return request<GateLookup>(`/gate/lookup?otp=${encodeURIComponent(otp)}`, {}, token);
  },

  checkInVisitor(token: string, id: string) {
    return request<Visitor>(`/visitors/${id}/check-in`, { method: "POST" }, token);
  },

  checkOutVisitor(token: string, id: string) {
    return request<Visitor>(`/visitors/${id}/check-out`, { method: "POST" }, token);
  },

  dailyGateLogs(token: string, date?: string) {
    const q = date ? `?date=${encodeURIComponent(date)}` : "";
    return request<DailyGateLogs>(`/gate/daily-logs${q}`, {}, token);
  },

  staffAttendanceToday(token: string) {
    return request<StaffAttendanceEntry[]>("/staff/attendance/today", {}, token);
  },

  staffCheckOut(token: string, staffId: string) {
    return request<{ ok: boolean; message: string }>(
      `/staff/${staffId}/check-out`,
      { method: "POST" },
      token
    );
  },

  updateDelivery(token: string, id: string, status: string) {
    return request<Delivery>(`/deliveries/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }, token);
  },

  staff(token: string) {
    return request<Staff[]>("/staff", {}, token);
  },

  createStaff(token: string, body: Record<string, unknown>) {
    return request<Staff>("/staff", { method: "POST", body: JSON.stringify(body) }, token);
  },

  staffCheckIn(token: string, staffId: string) {
    return request<{ ok: boolean; message: string }>(`/staff/${staffId}/check-in`, { method: "POST" }, token);
  },

  vehicles(token: string, last4?: string) {
    const q = last4 ? `?last4=${last4}` : "";
    return request<Vehicle[]>(`/vehicles${q}`, {}, token);
  },

  createVehicle(token: string, body: Record<string, unknown>) {
    return request<Vehicle>("/vehicles", { method: "POST", body: JSON.stringify(body) }, token);
  },

  complaints(token: string) {
    return request<Complaint[]>("/complaints", {}, token);
  },

  createComplaint(token: string, body: Record<string, unknown>) {
    return request<Complaint>("/complaints", { method: "POST", body: JSON.stringify(body) }, token);
  },

  updateComplaint(token: string, id: string, body: Record<string, unknown>) {
    return request<Complaint>(`/complaints/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token);
  },

  sosAlerts(token: string) {
    return request<SosAlert[]>("/sos", {}, token);
  },

  raiseSos(token: string, message?: string) {
    return request<SosAlert>("/sos", {
      method: "POST",
      body: JSON.stringify({ message }),
    }, token);
  },

  resolveSos(token: string, id: string) {
    return request<SosAlert>(`/sos/${id}/resolve`, { method: "POST" }, token);
  },

  kidsExit(token: string) {
    return request<KidExit[]>("/kids-exit", {}, token);
  },

  createKidExit(token: string, body: Record<string, unknown>) {
    return request<KidExit>("/kids-exit", { method: "POST", body: JSON.stringify(body) }, token);
  },

  approveKidExit(token: string, id: string) {
    return request<KidExit>(`/kids-exit/${id}/approve`, { method: "POST" }, token);
  },

  denyKidExit(token: string, id: string) {
    return request<KidExit>(`/kids-exit/${id}/deny`, { method: "POST" }, token);
  },

  emergencyContacts(token: string) {
    return request<EmergencyContact[]>("/emergency", {}, token);
  },

  accountsSummary(token: string) {
    return request<AccountsSummary>("/accounts/summary", {}, token);
  },

  completeSetup(
    token: string,
    body: {
      current_password: string;
      new_password: string;
      name: string;
      email?: string;
      contact_phone?: string;
      flat_id?: string;
      show_in_directory?: boolean;
      vehicles?: SetupVehicleInput[];
    }
  ) {
    return request<CompleteSetupResponse>("/auth/complete-setup", {
      method: "POST",
      body: JSON.stringify(body),
    }, token);
  },

  updateProfile(token: string, body: Record<string, unknown>) {
    return request<User>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token);
  },

  changePassword(token: string, current_password: string, new_password: string) {
    return request<{ ok: boolean; access_token: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    }, token);
  },

  realtimeSummary(token: string) {
    return request<RealtimeSummary>("/realtime/summary", {}, token);
  },

  bills(token: string) {
    return request<Bill[]>("/bills", {}, token);
  },

  myBills(token: string) {
    return request<Bill[]>("/bills/mine", {}, token);
  },

  collectionDashboard(token: string, month: string) {
    return request<CollectionDashboard>(`/bills/collection?month=${encodeURIComponent(month)}`, {}, token);
  },

  generateBills(token: string, month?: string) {
    return request<Bill[]>("/bills/generate", {
      method: "POST",
      body: JSON.stringify({ month }),
    }, token);
  },

  payBill(token: string, id: string, method = "UPI", reference?: string) {
    return request<Bill>(`/bills/${id}/pay`, {
      method: "POST",
      body: JSON.stringify({ method, reference }),
    }, token);
  },

  createRazorpayOrder(token: string, billId: string) {
    return request<RazorpayOrder>(`/bills/${billId}/razorpay-order`, {
      method: "POST",
      body: JSON.stringify({}),
    }, token);
  },

  verifyRazorpayPayment(token: string, billId: string, payment: RazorpayPaymentResponse) {
    return request<Bill>(`/bills/${billId}/razorpay-verify`, {
      method: "POST",
      body: JSON.stringify({
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      }),
    }, token);
  },

  async downloadBillReceipt(token: string, id: string) {
    const res = await fetch(`${API_BASE}/bills/${id}/receipt`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message =
        typeof data.detail === "string" ? data.detail : res.statusText ?? "Download failed";
      throw new ApiError(res.status, message);
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? `receipt-${id}.pdf`;
    return { blob, filename };
  },

  expenses(token: string) {
    return request<Expense[]>("/expenses", {}, token);
  },

  createExpense(token: string, body: Record<string, unknown>) {
    return request<Expense>("/expenses", { method: "POST", body: JSON.stringify(body) }, token);
  },

  transactions(token: string) {
    return request<Transaction[]>("/transactions", {}, token);
  },

  amenities(token: string) {
    return request<Amenity[]>("/amenities", {}, token);
  },

  createAmenity(token: string, body: Record<string, unknown>) {
    return request<Amenity>("/amenities", { method: "POST", body: JSON.stringify(body) }, token);
  },

  bookings(token: string) {
    return request<Booking[]>("/amenities/bookings", {}, token);
  },

  createBooking(token: string, body: Record<string, unknown>) {
    return request<Booking>("/amenities/bookings", { method: "POST", body: JSON.stringify(body) }, token);
  },

  polls(token: string) {
    return request<Poll[]>("/polls", {}, token);
  },

  createPoll(token: string, body: Record<string, unknown>) {
    return request<Poll>("/polls", { method: "POST", body: JSON.stringify(body) }, token);
  },

  votePoll(token: string, pollId: string, optionId: string) {
    return request<Poll>(`/polls/${pollId}/vote`, {
      method: "POST",
      body: JSON.stringify({ option_id: optionId }),
    }, token);
  },

  events(token: string) {
    return request<SocietyEvent[]>("/events", {}, token);
  },

  createEvent(token: string, body: Record<string, unknown>) {
    return request<SocietyEvent>("/events", { method: "POST", body: JSON.stringify(body) }, token);
  },

  documents(token: string) {
    return request<Document[]>("/documents", {}, token);
  },

  createDocument(token: string, body: Record<string, unknown>) {
    return request<Document>("/documents", { method: "POST", body: JSON.stringify(body) }, token);
  },

  moves(token: string) {
    return request<MoveRequest[]>("/moves", {}, token);
  },

  createMove(token: string, body: Record<string, unknown>) {
    return request<MoveRequest>("/moves", { method: "POST", body: JSON.stringify(body) }, token);
  },

  updateMove(token: string, id: string, status: string) {
    return request<MoveRequest>(`/moves/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }, token);
  },

  directory(token: string) {
    return request<DirectoryEntry[]>("/directory", {}, token);
  },

  updateDirectory(token: string, body: Record<string, unknown>) {
    return request<DirectoryEntry>("/directory/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }, token);
  },

  notifications(token: string) {
    return request<Notification[]>("/notifications", {}, token);
  },

  markNotificationRead(token: string, id: string) {
    return request<{ ok: boolean }>(`/notifications/${id}/read`, { method: "POST" }, token);
  },

  createEmergencyContact(token: string, body: Record<string, unknown>) {
    return request<EmergencyContact>("/emergency", { method: "POST", body: JSON.stringify(body) }, token);
  },

  rateStaff(token: string, staffId: string, rating: number, review?: string) {
    return request<{ ok: boolean }>("/staff/rate", {
      method: "POST",
      body: JSON.stringify({ staff_id: staffId, rating, review }),
    }, token);
  },
};

export { ApiError };
