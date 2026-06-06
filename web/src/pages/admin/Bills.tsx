import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import type { CollectionDashboard } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

function statusBadge(status: string) {
  if (status === "PAID") {
    return <span className="badge badge-green">Paid</span>;
  }
  return <span className="badge badge-red">Pending</span>;
}

export default function AdminBills() {
  const { token } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<CollectionDashboard | null>(null);
  const [busy, setBusy] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const monthOptions = useMemo(() => {
    const options: string[] = [];
    const base = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      options.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return options;
  }, []);

  function load() {
    if (token) api.collectionDashboard(token, month).then(setData);
  }

  useEffect(() => { load(); }, [token, month]);

  async function generate() {
    if (!token) return;
    setBusy(true);
    try {
      await api.generateBills(token, month);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function markCash(billId: string) {
    if (!token) return;
    setPayingId(billId);
    try {
      await api.payBill(token, billId, "CASH");
      load();
    } finally {
      setPayingId(null);
    }
  }

  async function downloadReceipt(billId: string) {
    if (!token) return;
    const { blob, filename } = await api.downloadBillReceipt(token, billId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const summary = data?.summary;
  const paidPct = summary && summary.flat_count > 0
    ? ((summary.flats_paid / summary.flat_count) * 100).toFixed(1)
    : "0";

  return (
    <Shell title="Collection Dashboard" nav={ADMIN_NAV}>
      <div className="collection-toolbar">
        <div className="field" style={{ margin: 0, minWidth: 200 }}>
          <label>Billing period</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {monthOptions.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>
        <button type="button" className="btn" onClick={generate} disabled={busy}>
          {busy ? "Generating…" : "Generate bills for period"}
        </button>
      </div>

      {summary && (
        <div className="grid-3">
          <div className="card stat-card">
            <p className="muted">Collected</p>
            <p className="stat-value">{inr(summary.collected)}</p>
          </div>
          <div className="card stat-card">
            <p className="muted">Still pending</p>
            <p className="stat-value stat-pending">{inr(summary.still_pending)}</p>
          </div>
          <div className="card stat-card">
            <p className="muted">Flats paid</p>
            <p className="stat-value">
              {summary.flats_paid} / {summary.flat_count}
              <span className="muted" style={{ fontSize: "0.85rem", fontWeight: 400 }}> ({paidPct}%)</span>
            </p>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Flat</th>
              <th>Name</th>
              <th>Type</th>
              <th>Total</th>
              <th>Status</th>
              <th>Paid by</th>
              <th>Txn</th>
              <th>Gateway</th>
              <th>Receipt</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.flat_label}</strong></td>
                <td>{row.resident_name ?? "—"}</td>
                <td>{row.resident_type ?? "—"}</td>
                <td>{inr(row.amount)}</td>
                <td>{statusBadge(row.status)}</td>
                <td>{row.paid_by_name ?? "—"}</td>
                <td className="mono">{row.transaction_id ? row.transaction_id.slice(0, 10) : "—"}</td>
                <td>{row.payment_method ?? "—"}</td>
                <td>
                  {row.status === "PAID" ? (
                    <button type="button" className="link-btn" onClick={() => downloadReceipt(row.id)}>
                      PDF
                    </button>
                  ) : "—"}
                </td>
                <td>
                  {row.status !== "PAID" ? (
                    <button
                      type="button"
                      className="link-btn"
                      disabled={payingId === row.id}
                      onClick={() => markCash(row.id)}
                    >
                      {payingId === row.id ? "Saving…" : "Mark cash"}
                    </button>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.rows.length === 0 && (
          <p className="muted" style={{ padding: "1.25rem", margin: 0 }}>
            No bills for {monthLabel(month)}. Click <strong>Generate bills for period</strong> to create maintenance entries for all flats.
          </p>
        )}
      </div>
    </Shell>
  );
}
