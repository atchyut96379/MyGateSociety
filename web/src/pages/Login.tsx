import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Role } from "../api/types";
import { SOCIETY_NAME } from "../components/Shell";

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Secretary (Main Admin)" },
  { value: "COMMITTEE", label: "Committee member" },
  { value: "RESIDENT", label: "Resident" },
  { value: "SECURITY", label: "Guard" },
];

export default function LoginPage() {
  const { login, user, logout } = useAuth();
  const [bootstrapMode, setBootstrapMode] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("ADMIN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.loginConfig().then((cfg) => {
      setBootstrapMode(cfg.bootstrap_mode);
      if (cfg.bootstrap_mode) {
        setPhone(cfg.bootstrap_login_id);
        setRole("ADMIN");
      }
    }).catch(() => setBootstrapMode(false));
  }, []);

  const canSubmit = phone.trim().length > 0 && password.length > 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError(bootstrapMode ? "Enter the bootstrap password" : "Enter mobile number and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(phone, password, bootstrapMode ? "ADMIN" : role);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: "2rem" }}>
      <h1 style={{ textAlign: "center", color: "var(--primary)", margin: 0 }}>
        {SOCIETY_NAME}
      </h1>

      {bootstrapMode ? (
        <p className="muted" style={{ textAlign: "center", fontSize: "0.9rem" }}>
          <strong>First-time Secretary setup.</strong> Use the default login below once, then set your profile and mobile number.
        </p>
      ) : (
        <p className="muted" style={{ textAlign: "center", fontSize: "0.9rem" }}>
          Sign in with your <strong>mobile number</strong> (not <code>Admin</code>) and your password.
          <br />
          Secretary: use the mobile you set during first-time setup, role <strong>Secretary (Main Admin)</strong>.
        </p>
      )}

      {bootstrapMode && (
        <div className="card" style={{ background: "#fffbeb", borderColor: "#fcd34d", marginBottom: "1rem" }}>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            <strong>One-time login:</strong> ID <code>Admin</code> · Password <code>admin</code> · Role <strong>Secretary</strong>
            <br />
            After setup, <code>Admin</code> will not work — use your mobile number.
          </p>
        </div>
      )}

      {user && (
        <div className="card" style={{ background: "#ecfdf5", borderColor: "#6ee7b7" }}>
          <p style={{ margin: 0 }}>
            Signed in as <strong>{user.name}</strong>
            {user.flat_label ? ` · Flat ${user.flat_label}` : ""}
          </p>
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
            <Link
              to={
                user.role === "ADMIN" || user.role === "COMMITTEE"
                  ? "/admin"
                  : user.role === "SECURITY"
                    ? "/security"
                    : "/resident"
              }
              className="btn btn-secondary"
            >
              Dashboard
            </Link>
            <button type="button" className="btn btn-danger" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Sign in</h2>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label>{bootstrapMode ? "Login ID" : "Mobile number"}</label>
            <input
              type={bootstrapMode ? "text" : "tel"}
              inputMode={bootstrapMode ? "text" : "numeric"}
              value={phone}
              onChange={(e) => !bootstrapMode && setPhone(e.target.value)}
              readOnly={bootstrapMode === true}
              placeholder={bootstrapMode ? "Admin" : "10-digit mobile"}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {bootstrapMode && password.length > 0 && (
            <p className="muted" style={{ marginTop: 0 }}>
              Signing in as: <strong>Secretary (Main Admin)</strong>
            </p>
          )}
          {!bootstrapMode && (
            <div className="field">
              <label>I am signing in as</label>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ALL_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && <p className="error">{error}</p>}
          <button
            type="submit"
            className="btn btn-block btn-lg"
            disabled={loading || !canSubmit}
          >
            {loading ? "Signing in…" : "Open app"}
          </button>
        </form>
      </div>

      <p style={{ textAlign: "center", marginTop: "1rem" }}>
        {!bootstrapMode && (
          <>
            <Link to="/forgot-password">Forgot password?</Link>
            <span className="muted"> · </span>
          </>
        )}
        <Link to="/">← Home</Link>
      </p>
    </div>
  );
}
