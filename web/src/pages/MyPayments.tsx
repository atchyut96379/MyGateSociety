import { Link } from "react-router-dom";
import { MaintenancePayments } from "../components/MaintenancePayments";
import { Shell } from "../components/Shell";
import { useAuth } from "../auth/AuthContext";
import { ADMIN_NAV, RESIDENT_NAV } from "../lib/nav";

function homeForRole(role: string) {
  if (role === "ADMIN" || role === "COMMITTEE") return "/admin";
  if (role === "SECURITY") return "/security";
  return "/resident";
}

export default function MyPaymentsPage() {
  const { user } = useAuth();
  const nav = user?.role === "RESIDENT" ? RESIDENT_NAV : ADMIN_NAV;
  const back = homeForRole(user?.role ?? "RESIDENT");

  return (
    <Shell title="My Payments" nav={nav}>
      <p className="muted" style={{ marginTop: 0 }}>
        <Link to={back}>← Back to dashboard</Link>
        {user?.flat_label ? ` · Flat ${user.flat_label}` : ""}
      </p>
      <MaintenancePayments />
    </Shell>
  );
}
