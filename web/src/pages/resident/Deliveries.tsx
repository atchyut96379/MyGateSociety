import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "../../api/client";
import type { Delivery } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentDeliveries() {
  const { token } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("ALLOW_ENTRY");
  const [showForm, setShowForm] = useState(false);
  const [newPass, setNewPass] = useState<Delivery | null>(null);
  const [error, setError] = useState("");

  function load() {
    if (!token) return;
    api.deliveries(token).then(setDeliveries);
  }

  useEffect(() => {
    load();
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    try {
      const d = await api.createDelivery(token, {
        company,
        description: description || null,
        mode,
      });
      setNewPass(d);
      setCompany("");
      setDescription("");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create delivery");
    }
  }

  return (
    <Shell title="Deliveries" nav={RESIDENT_NAV}>
      <button
        type="button"
        className="btn"
        style={{ marginBottom: "1rem" }}
        onClick={() => {
          setShowForm(!showForm);
          setNewPass(null);
        }}
      >
        {showForm ? "Cancel" : "+ Expect delivery"}
      </button>

      {newPass && (
        <div className="card" style={{ background: "#ecfdf5" }}>
          <h3>{newPass.company}</h3>
          <p className="muted">Delivery OTP for guard</p>
          <div className="otp-display">{newPass.otp}</div>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Mode: {newPass.mode.replace(/_/g, " ")}
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="card">
          <div className="field">
            <label>Company / courier</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Amazon, Swiggy, etc."
              required
            />
          </div>
          <div className="field">
            <label>Description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="field">
            <label>Instruction</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="ALLOW_ENTRY">Allow entry to flat</option>
              <option value="LEAVE_AT_GATE">Leave at gate</option>
              <option value="DENY">Deny entry</option>
            </select>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-block">
            Create delivery pass
          </button>
        </form>
      )}

      <div className="card">
        <h3>Your deliveries</h3>
        {deliveries.length === 0 ? (
          <p className="muted">No deliveries yet.</p>
        ) : (
          deliveries.map((d) => (
            <div key={d.id} className="list-row">
              <div>
                <strong>{d.company}</strong>
                <br />
                <span className="muted">{d.status} · {d.mode.replace(/_/g, " ")}</span>
              </div>
              <span className="badge badge-amber">{d.otp}</span>
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}
