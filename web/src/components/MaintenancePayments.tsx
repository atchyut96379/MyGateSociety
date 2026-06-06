import { useEffect, useState } from "react";
import { ApiError, api } from "../api/client";
import type { Bill } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { payBillWithRazorpay } from "../lib/razorpay";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function saveReceipt(token: string, billId: string) {
  const { blob, filename } = await api.downloadBillReceipt(token, billId);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function MaintenancePayments() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Bill[]>([]);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    if (token) api.myBills(token).then(setItems);
  }

  useEffect(() => { load(); }, [token]);

  const pending = items.filter((b) => b.status !== "PAID");

  async function payNow(bill: Bill) {
    if (!token || !user) return;
    setPayingId(bill.id);
    setError("");
    try {
      await payBillWithRazorpay(token, bill.id, {
        name: user.name,
        phone: user.phone,
        email: user.email,
      });
      await saveReceipt(token, bill.id);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 499) return;
      setError(err instanceof ApiError ? err.message : "Payment failed. Please try again.");
    } finally {
      setPayingId(null);
    }
  }

  if (!user?.flat_id) {
    return (
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>
          No flat is linked to your account. Contact the society office to assign your flat before paying maintenance.
        </p>
      </div>
    );
  }

  return (
    <>
      {pending.length > 0 && (
        <div className="card pay-now-banner">
          <div>
            <h3 style={{ margin: "0 0 0.25rem" }}>Maintenance pending — Flat {user.flat_label}</h3>
            <p className="muted" style={{ margin: 0 }}>
              {pending.length} unpaid bill{pending.length > 1 ? "s" : ""}. Pay now to get your receipt instantly.
            </p>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {items.map((b) => (
        <div key={b.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{b.month}</strong>
            {b.status === "PAID" ? (
              <span className="badge badge-green">Paid</span>
            ) : (
              <span className="badge badge-red">Pending</span>
            )}
          </div>
          <p style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0.5rem 0" }}>{inr(b.amount)}</p>
          <p className="muted">Due {new Date(b.due_date).toLocaleDateString()}</p>
          {b.description && <p>{b.description}</p>}
          {b.status !== "PAID" && (
            <button
              type="button"
              className="btn btn-block btn-lg"
              disabled={payingId === b.id}
              onClick={() => payNow(b)}
            >
              {payingId === b.id ? "Processing…" : "Pay Now"}
            </button>
          )}
          {b.paid_at && (
            <p className="muted">
              Paid {new Date(b.paid_at).toLocaleString()}
              {b.payment_method ? ` · ${b.payment_method}` : ""}
            </p>
          )}
          {b.status === "PAID" && token && (
            <button
              type="button"
              className="btn btn-block"
              style={{ marginTop: "0.5rem" }}
              onClick={() => saveReceipt(token, b.id)}
            >
              Download receipt (PDF)
            </button>
          )}
        </div>
      ))}

      {items.length === 0 && (
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            No maintenance bills for Flat {user.flat_label} yet.
          </p>
        </div>
      )}
    </>
  );
}
