import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Shell, SOCIETY_NAME } from "../components/Shell";
import { ADMIN_NAV, RESIDENT_NAV } from "../lib/nav";

export default function ChangePasswordPage() {
  const { token, user, refresh, applyToken } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nav =
    user?.role === "ADMIN" || user?.role === "COMMITTEE"
      ? ADMIN_NAV
      : user?.role === "SECURITY"
        ? []
        : RESIDENT_NAV;

  useEffect(() => {
    if (user?.must_change_password) {
      navigate("/setup", { replace: true });
    }
  }, [user, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.changePassword(token, current, next);
      applyToken(res.access_token);
      await refresh();
      const home =
        user?.role === "ADMIN" || user?.role === "COMMITTEE"
          ? "/admin"
          : user?.role === "SECURITY"
            ? "/security"
            : "/resident";
      navigate(home);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  const body = (
    <>
      <form onSubmit={onSubmit} className="card">
        <p className="muted">
          <Link to="/profile">← Back to profile</Link>
        </p>
        <div className="field">
          <label>Current password</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </div>
        <div className="field">
          <label>New password</label>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-block" disabled={loading}>
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </>
  );

  if (user && nav.length > 0) {
    return <Shell title="Change password" nav={nav}>{body}</Shell>;
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: "2rem" }}>
      <h1 style={{ textAlign: "center", color: "var(--primary)" }}>{SOCIETY_NAME}</h1>
      <h2>Change password</h2>
      {body}
    </div>
  );
}
