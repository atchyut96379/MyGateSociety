import { Link } from "react-router-dom";
import { SOCIETY_NAME } from "../components/Shell";

const FEATURES = [
  { title: "One app", desc: "Resident & Guard", icon: "📱" },
  { title: "Visitors", desc: "6-digit OTP pass", icon: "👤" },
  { title: "Delivery", desc: "Approve at gate", icon: "📦" },
  { title: "Notices", desc: "Society updates", icon: "📢" },
  { title: "90 flats", desc: "101–519 layout", icon: "🏠" },
  { title: "Accounts", desc: "Ledger (soon)", icon: "📊" },
];

export default function HomePage() {
  return (
    <div className="container-wide" style={{ padding: "2rem 1rem" }}>
      <p className="muted" style={{ textTransform: "uppercase", fontSize: "0.8rem", fontWeight: 600 }}>
        {SOCIETY_NAME}
      </p>
      <h1 style={{ margin: "0.5rem 0", fontSize: "2rem" }}>
        Society security & community portal
      </h1>
      <p className="muted">
        One application for residents, guards, and the management committee.
        Sign in with your mobile number from the society office.
      </p>
      <Link to="/login" className="btn btn-lg" style={{ marginTop: "1.5rem", display: "inline-block" }}>
        Sign in
      </Link>

      <h2 style={{ marginTop: "2.5rem", marginBottom: "1rem" }}>Services</h2>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <Link key={f.title} to="/login" className="feature-tile">
            <div className="icon">{f.icon}</div>
            <div className="title">{f.title}</div>
            <div className="desc">{f.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
