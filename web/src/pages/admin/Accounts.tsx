import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import type { AccountsSummary } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export default function AdminAccounts() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<AccountsSummary | null>(null);

  useEffect(() => {
    if (token) api.accountsSummary(token).then(setSummary);
  }, [token]);

  return (
    <Shell title="Society accounts" nav={ADMIN_NAV}>
      {summary && (
        <div className="grid-2">
          <div className="card">
            <p className="muted">Total collected</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--primary)" }}>
              {inr(summary.total_collected)}
            </p>
          </div>
          <div className="card">
            <p className="muted">Total expenses</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>{inr(summary.total_expenses)}</p>
          </div>
          <div className="card">
            <p className="muted">Society balance</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>{inr(summary.balance)}</p>
          </div>
          <div className="card">
            <p className="muted">Unpaid bills</p>
            <p style={{ fontSize: "1.75rem", fontWeight: 700 }}>{summary.pending_bills}</p>
          </div>
        </div>
      )}
      <Link to="/admin" className="muted">← Admin home</Link>
    </Shell>
  );
}
