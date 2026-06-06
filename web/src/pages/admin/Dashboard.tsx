import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import type { AccountsSummary } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { NoticeBoard } from "../../components/NoticeBoard";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState<AccountsSummary | null>(null);

  useEffect(() => {
    if (token) api.accountsSummary(token).then(setSummary);
  }, [token]);

  const features = [
    ...(user?.is_main_admin
      ? [
          { to: "/admin/users/new", title: "Create logins", desc: "Excel or single user", icon: "➕" },
          { to: "/admin/guards/new", title: "Create guards", desc: "Gate security only", icon: "🛡️" },
        ]
      : []),
    { to: "/admin/flats", title: "All flats", desc: "90 homes · 5 floors", icon: "🏢" },
    { to: "/admin/users", title: "User list", desc: "All accounts", icon: "👥" },
    { to: "/admin/finance", title: "Finance", desc: "Bills & expenses", icon: "📊" },
    { to: "/admin/bills", title: "Collection Dashboard", desc: "Pending maintenance", icon: "🧾" },
    { to: "/admin/complaints", title: "Helpdesk", desc: "Complaints", icon: "🛠️" },
    { to: "/admin/notices", title: "Notices", desc: "Post updates", icon: "📢" },
    { to: "/admin/more", title: "All modules", desc: "Polls, events, more", icon: "☰" },
    { to: "/security", title: "Gate console", desc: "OTP & vehicles", icon: "🚧" },
  ];

  return (
    <Shell title="Admin" nav={ADMIN_NAV}>
      <p className="muted">
        Hi <strong>{user?.name}</strong>
        {user?.committee_role ? ` · ${user.committee_role.replace(/_/g, " ")}` : " — Secretary"}
      </p>

      <NoticeBoard noticesHref="/admin/notices" />

      {summary && (
        <div className="grid-2">
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>Balance</p>
            <p style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0, color: "var(--primary)" }}>
              ₹{summary.balance.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>Society unpaid bills</p>
            <p style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0 }}>{summary.pending_bills}</p>
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: "0.75rem" }}>Quick actions</h3>
      <div className="feature-grid">
        {features.map((f) => (
          <Link key={f.to} to={f.to} className="feature-tile">
            <div className="icon">{f.icon}</div>
            <div className="title">{f.title}</div>
            <div className="desc">{f.desc}</div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
