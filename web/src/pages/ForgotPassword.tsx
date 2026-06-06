import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { Role } from "../api/types";
import { SOCIETY_NAME } from "../components/Shell";
import { COMMITTEE_ROLES } from "../lib/committee";

const ROLES: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Secretary (Main Admin)" },
  { value: "COMMITTEE", label: "Committee member" },
  { value: "RESIDENT", label: "Resident" },
  { value: "SECURITY", label: "Guard" },
];

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("RESIDENT");
  const [committeeRole, setCommitteeRole] = useState("PRESIDENT");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ password: string; message: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const body: { phone: string; role: string; committee_role?: string } = {
        phone,
        role,
      };
      if (role === "COMMITTEE") body.committee_role = committeeRole;
      const res = await api.forgotPassword(body);
      setResult({ password: res.password, message: res.message });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: "2rem" }}>
      <h1 style={{ textAlign: "center", color: "var(--primary)", margin: 0 }}>
        {SOCIETY_NAME}
      </h1>
      <p className="muted" style={{ textAlign: "center", fontSize: "0.9rem" }}>
        Reset your password to the <strong>office default</strong> using your mobile number and role.
      </p>

      {result ? (
        <div className="card credentials-box">
          <h3 style={{ marginTop: 0 }}>Password reset</h3>
          <p>{result.message}</p>
          <p>
            <strong>Your new office password:</strong>{" "}
            <code style={{ fontSize: "1.1rem" }}>{result.password}</code>
          </p>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Sign in with this password, then set a personal password when prompted.
          </p>
          <Link to="/login" className="btn btn-block" style={{ marginTop: "1rem" }}>
            Go to sign in
          </Link>
        </div>
      ) : (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Forgot password</h2>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label>Mobile number</label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                required
              />
            </div>
            <div className="field">
              <label>I am registered as</label>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {role === "COMMITTEE" && (
              <div className="field">
                <label>Committee role</label>
                <select
                  value={committeeRole}
                  onChange={(e) => setCommitteeRole(e.target.value)}
                  required
                >
                  {COMMITTEE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn btn-block" disabled={loading}>
              {loading ? "Resetting…" : "Reset to office password"}
            </button>
          </form>
        </div>
      )}

      <p style={{ textAlign: "center", marginTop: "1rem" }}>
        <Link to="/login">← Back to sign in</Link>
      </p>
    </div>
  );
}
