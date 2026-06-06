import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useRealtime } from "../hooks/useRealtime";
import { NoticeBoard } from "./NoticeBoard";
import { PayNowBanner } from "./PayNowBanner";

export const SOCIETY_NAME = "Marvel Rocks Society";

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

export function Shell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const live = useRealtime();

  const alerts = live?.unread_notifications ?? 0;
  const isHome = location.pathname === "/resident" || location.pathname === "/admin";
  const showNotices =
    user &&
    user.role !== "SECURITY" &&
    !location.pathname.endsWith("/notices") &&
    !isHome;
  const noticesHref =
    user?.role === "RESIDENT" ? "/resident/notices" : "/admin/notices";

  return (
    <div>
      <header className="shell-header">
        <div>
          <h1>{title}</h1>
          {user && (
            <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.9 }}>
              {user.name}
              {user.flat_label ? ` · Flat ${user.flat_label}` : ""}
              {live && <span className="live-dot" title="Live updates" />}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {alerts > 0 && (
            <Link
              to={
                user?.role === "RESIDENT"
                  ? "/resident/notifications"
                  : "/admin/complaints"
              }
              className="nav-badge"
            >
              {alerts}
            </Link>
          )}
          {!user?.must_change_password && (
            <Link to="/profile" className="header-link">
              Profile
            </Link>
          )}
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <main className="shell-body container">
        {user?.flat_id && live && live.pending_bills > 0 && (
          <PayNowBanner count={live.pending_bills} flatLabel={user.flat_label} />
        )}
        {showNotices && (
          <NoticeBoard noticesHref={noticesHref} limit={5} compact />
        )}
        {children}
      </main>
      <nav className="bottom-nav">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={location.pathname === item.to ? "active" : ""}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
            {item.to === "/resident/more" && alerts > 0 && (
              <span className="nav-dot" />
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function GuardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const live = useRealtime(3000);

  return (
    <div>
      <header className="shell-header">
        <div>
          <h1>{title}</h1>
          {live && live.active_sos > 0 && (
            <p className="sos-banner">🚨 {live.active_sos} active SOS alert(s)</p>
          )}
          {user && !user.must_change_password && (
            <Link to="/profile" className="header-link" style={{ fontSize: "0.8rem" }}>
              Profile
            </Link>
          )}
        </div>
        <button type="button" onClick={logout}>
          Logout
        </button>
      </header>
      <main className="container" style={{ paddingTop: "1rem" }}>
        {children}
      </main>
    </div>
  );
}
