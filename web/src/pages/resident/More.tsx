import { Link } from "react-router-dom";
import { Shell } from "../../components/Shell";
import { RESIDENT_MORE_LINKS, RESIDENT_NAV } from "../../lib/nav";

export default function ResidentMore() {
  return (
    <Shell title="More services" nav={RESIDENT_NAV}>
      <div className="feature-grid">
        {RESIDENT_MORE_LINKS.map((f) => (
          <Link key={f.to} to={f.to} className="feature-tile">
            <div className="icon">{f.icon}</div>
            <div className="title">{f.title}</div>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
