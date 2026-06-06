import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { AccountsSummary } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function ResidentAccounts() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<AccountsSummary | null>(null);

  useEffect(() => {
    if (token) api.accountsSummary(token).then(setSummary);
  }, [token]);

  if (!summary) return <Shell title="Accounts" nav={RESIDENT_NAV}><p className="muted">Loading…</p></Shell>;

  return (
    <Shell title="Society accounts" nav={RESIDENT_NAV}>
      <div className="grid-2">
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Collected</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--primary)" }}>
            {inr(summary.total_collected)}
          </p>
        </div>
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Expenses</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{inr(summary.total_expenses)}</p>
        </div>
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Balance</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{inr(summary.balance)}</p>
        </div>
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>Pending bills</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>{summary.pending_bills}</p>
        </div>
      </div>
      <p className="muted" style={{ fontSize: "0.85rem" }}>
        Transparent ledger — {summary.flat_count} flats in society
      </p>
    </Shell>
  );
}
