import { Link } from "react-router-dom";
import { NoticeBoard } from "../../components/NoticeBoard";
import { Shell } from "../../components/Shell";
import { useAuth } from "../../auth/AuthContext";
import { useRealtime } from "../../hooks/useRealtime";
import { RESIDENT_NAV } from "../../lib/nav";

const FEATURES = [
  { to: "/resident/notices", title: "Notices", desc: "Society updates", icon: "📢" },
  { to: "/resident/visitors", title: "Invite visitor", desc: "6-digit OTP", icon: "👤" },
  { to: "/resident/deliveries", title: "Delivery", desc: "Approve / deny", icon: "📦" },
  { to: "/resident/staff", title: "Domestic staff", desc: "Daily passcode", icon: "🧹" },
  { to: "/resident/vehicles", title: "Vehicles", desc: "Register car/bike", icon: "🚗" },
  { to: "/resident/bills", title: "My Payments", desc: "Pay maintenance", icon: "🧾" },
  { to: "/resident/kids", title: "Kids exit", desc: "Approve at gate", icon: "👧" },
  { to: "/resident/sos", title: "SOS", desc: "Security alert", icon: "🚨" },
  { to: "/resident/notifications", title: "Alerts", desc: "Live updates", icon: "🔔" },
];

export default function ResidentDashboard() {
  const { user } = useAuth();
  const live = useRealtime();

  return (
    <Shell title={`Flat ${user?.flat_label ?? "—"}`} nav={RESIDENT_NAV}>
      <p className="muted">
        Hi <strong>{user?.name}</strong> — resident
      </p>

      <NoticeBoard noticesHref="/resident/notices" />

      {live && (
        <div className="grid-2">
          {live.pending_deliveries > 0 && (
            <Link to="/resident/deliveries" className="card live-card">
              <strong>{live.pending_deliveries}</strong>
              <span className="muted"> pending deliveries</span>
            </Link>
          )}
          {live.pending_bills > 0 && (
            <Link to="/my-payments" className="card live-card pay-now-card">
              <strong>Pay Now</strong>
              <span className="muted"> · {live.pending_bills} pending maintenance</span>
            </Link>
          )}
          {live.unread_notifications > 0 && (
            <Link to="/resident/notifications" className="card live-card">
              <strong>{live.unread_notifications}</strong>
              <span className="muted"> new alerts</span>
            </Link>
          )}
          {live.pending_kids_exit > 0 && (
            <Link to="/resident/kids" className="card live-card">
              <strong>{live.pending_kids_exit}</strong>
              <span className="muted"> kids exit pending</span>
            </Link>
          )}
        </div>
      )}

      <div className="card">
        <h3>Your flat</h3>
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>
          {user?.flat_label ?? "Not assigned"}
        </p>
      </div>

      <h3 style={{ marginBottom: "0.75rem" }}>Services</h3>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <Link key={f.to} to={f.to} className="feature-tile">
            <div className="icon">{f.icon}</div>
            <div className="title">{f.title}</div>
            <div className="desc">{f.desc}</div>
          </Link>
        ))}
      </div>

      <p style={{ marginTop: "1rem" }}>
        <Link to="/resident/more">More services →</Link>
        {" · "}
        <Link to="/profile">My profile</Link>
      </p>
    </Shell>
  );
}
