import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Shell } from "../components/Shell";
import { ADMIN_NAV, RESIDENT_NAV } from "../lib/nav";

export default function ProfilePage() {
  const { token, user, refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showInDirectory, setShowInDirectory] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const nav =
    user?.role === "ADMIN" || user?.role === "COMMITTEE"
      ? ADMIN_NAV
      : user?.role === "SECURITY"
        ? []
        : RESIDENT_NAV;

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email ?? "");
      setContactPhone(user.phone);
    }
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      await api.updateProfile(token, {
        name,
        email: email || null,
        contact_phone: user?.flat_id || user?.role === "RESIDENT" ? contactPhone : undefined,
        show_in_directory: user?.flat_id || user?.role === "RESIDENT" ? showInDirectory : undefined,
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  const form = (
    <form onSubmit={onSubmit} className="card">
      <div className="field">
        <label>Full name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="field">
        <label>Mobile (login ID)</label>
        <input value={user?.phone ?? ""} disabled />
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {user?.flat_label && (
        <p className="muted">Flat: <strong>{user.flat_label}</strong></p>
      )}
      {(user?.role === "RESIDENT" || user?.flat_label) && (
        <>
          <div className="field">
            <label>Directory contact phone</label>
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showInDirectory}
              onChange={(e) => setShowInDirectory(e.target.checked)}
            />
            Show in intercom directory
          </label>
        </>
      )}
      {saved && <p style={{ color: "var(--primary)" }}>Profile saved.</p>}
      {error && <p className="error">{error}</p>}
      <button type="submit" className="btn btn-block" disabled={loading}>
        {loading ? "Saving…" : "Save profile"}
      </button>
      <p style={{ marginTop: "1rem" }}>
        <Link to="/change-password">Change password →</Link>
      </p>
    </form>
  );

  if (nav.length > 0) {
    return <Shell title="My profile" nav={nav}>{form}</Shell>;
  }

  return (
    <div className="container" style={{ paddingTop: "1rem" }}>
      <h2>My profile</h2>
      {form}
    </div>
  );
}
