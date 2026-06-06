import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "../../api/client";
import type { Visitor } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

function todayIso() {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function endOfDayIso() {
  const d = new Date();
  d.setHours(21, 0, 0, 0);
  return d.toISOString();
}

export default function ResidentVisitors() {
  const { token } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [guestName, setGuestName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newPass, setNewPass] = useState<Visitor | null>(null);
  const [error, setError] = useState("");

  function load() {
    if (!token) return;
    api.visitors(token).then(setVisitors);
  }

  useEffect(() => {
    load();
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    const now = todayIso();
    const end = endOfDayIso();
    try {
      const v = await api.createVisitor(token, {
        guest_name: guestName,
        purpose: purpose || null,
        visit_date: now,
        valid_from: now,
        valid_until: end,
      });
      setNewPass(v);
      setGuestName("");
      setPurpose("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create pass");
    }
  }

  return (
    <Shell title="Visitors" nav={RESIDENT_NAV}>
      <button
        type="button"
        className="btn"
        style={{ marginBottom: "1rem" }}
        onClick={() => {
          setShowForm(!showForm);
          setNewPass(null);
        }}
      >
        {showForm ? "Cancel" : "+ Invite guest"}
      </button>

      {newPass && (
        <div className="card" style={{ background: "#ecfdf5" }}>
          <h3>Pass created for {newPass.guest_name}</h3>
          <p className="muted">Share this OTP with your guest</p>
          <div className="otp-display">{newPass.otp}</div>
        </div>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="card">
          <div className="field">
            <label>Guest name</label>
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Purpose (optional)</label>
            <input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-block">
            Generate OTP
          </button>
        </form>
      )}

      <div className="card">
        <h3>Your visitor passes</h3>
        {visitors.length === 0 ? (
          <p className="muted">No visitors yet.</p>
        ) : (
          visitors.map((v) => (
            <div key={v.id} className="list-row">
              <div>
                <strong>{v.guest_name}</strong>
                <br />
                <span className="muted">
                  {new Date(v.visit_date).toLocaleDateString()} · {v.status}
                </span>
              </div>
              <span className="badge badge-green">{v.otp}</span>
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}
