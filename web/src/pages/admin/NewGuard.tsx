import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ApiError, api } from "../../api/client";
import type { CreateUserResponse } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

export default function AdminNewGuard() {
  const { token, user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreateUserResponse | null>(null);

  if (!user?.is_main_admin) {
    return <Navigate to="/admin/users" replace />;
  }

  if (user.must_change_password) {
    return <Navigate to="/setup" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.createUser(token, {
        name: name.trim(),
        phone: phone.trim(),
        role: "SECURITY",
      });
      setCreated(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create guard");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    const c = created.credentials;
    return (
      <Shell title="Guard created" nav={ADMIN_NAV}>
        <div className="credentials-box">
          <h3 style={{ marginTop: 0 }}>Guard login — share with security staff</h3>
          <p>
            <strong>Name:</strong> {c.name}
            <br />
            <strong>Mobile:</strong> {c.phone}
            <br />
            <strong>Password:</strong> {c.password}
            <br />
            <strong>Role:</strong> Guard (Gate console)
          </p>
          <p className="muted">
            Guard signs in with mobile + password, role <strong>Guard</strong>, then uses the Gate console for OTP and vehicles.
          </p>
        </div>
        <Link to="/admin/guards/new" className="btn" style={{ marginTop: "1rem" }}>
          Create another guard
        </Link>
        <Link to="/admin/users" className="btn btn-secondary" style={{ marginTop: "0.5rem" }}>
          Back to user list
        </Link>
      </Shell>
    );
  }

  return (
    <Shell title="Create guard" nav={ADMIN_NAV}>
      <div className="card" style={{ marginBottom: "1rem", background: "#ecfdf5", borderColor: "#6ee7b7" }}>
        <p style={{ margin: 0 }}>
          Create a <strong>gate security</strong> login only. Guards use the{" "}
          <Link to="/security">Gate console</Link> — visitor OTP, deliveries, vehicle lookup.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label>Guard name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ramesh"
            required
            minLength={2}
          />
        </div>
        <div className="field">
          <label>Mobile (login ID)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile"
            required
          />
        </div>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          Office default password is generated automatically (e.g. <code>MarvSEC</code>). Guard can change it after first login.
        </p>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-block" disabled={loading}>
          {loading ? "Creating…" : "Create guard login"}
        </button>
      </form>

      <p style={{ marginTop: "1rem" }}>
        <Link to="/admin">← Admin home</Link>
        {" · "}
        <Link to="/admin/users">User list</Link>
      </p>
    </Shell>
  );
}
