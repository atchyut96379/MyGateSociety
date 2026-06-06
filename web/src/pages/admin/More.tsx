import { Link } from "react-router-dom";
import { Shell } from "../../components/Shell";
import { ADMIN_MORE_LINKS, ADMIN_MORE_PROFILE, ADMIN_NAV } from "../../lib/nav";

export default function AdminMore() {
  return (
    <Shell title="More" nav={ADMIN_NAV}>
      <div className="feature-grid">
        {ADMIN_MORE_LINKS.map((f) => (
          <Link key={f.to} to={f.to} className="feature-tile">
            <div className="icon">{f.icon}</div>
            <div className="title">{f.title}</div>
          </Link>
        ))}
      </div>
      <h3 style={{ marginTop: "1.5rem" }}>Account</h3>
      <div className="feature-grid">
        {ADMIN_MORE_PROFILE.map((f) => (
          <Link key={f.to} to={f.to} className="feature-tile">
            <div className="icon">{f.icon}</div>
            <div className="title">{f.title}</div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
