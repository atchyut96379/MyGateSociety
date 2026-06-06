import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "../../api/client";
import type { Staff } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentStaff() {
  const { token } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [name, setName] = useState("");
  const [staffType, setStaffType] = useState("Maid");
  const [newStaff, setNewStaff] = useState<Staff | null>(null);
  const [error, setError] = useState("");

  function load() {
    if (token) api.staff(token).then(setStaff);
  }

  useEffect(() => { load(); }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      const s = await api.createStaff(token, { name, staff_type: staffType });
      setNewStaff(s);
      setName("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  return (
    <Shell title="Domestic staff" nav={RESIDENT_NAV}>
      {newStaff && (
        <div className="card" style={{ background: "#ecfdf5" }}>
          <h3>{newStaff.name} registered</h3>
          <p className="muted">Daily gate passcode</p>
          <div className="otp-display">{newStaff.passcode}</div>
        </div>
      )}

      <form onSubmit={onSubmit} className="card">
        <h3>Register staff</h3>
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Type</label>
          <select value={staffType} onChange={(e) => setStaffType(e.target.value)}>
            <option>Maid</option>
            <option>Cook</option>
            <option>Driver</option>
            <option>Nanny</option>
            <option>Other</option>
          </select>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-block">Add staff</button>
      </form>

      <div className="card">
        <h3>Your staff</h3>
        {staff.map((s) => (
          <div key={s.id} style={{ marginBottom: "0.75rem" }}>
            <div className="list-row">
              <span>{s.name} · {s.staff_type}</span>
              <span className="badge badge-green">{s.passcode}</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: "0.35rem", fontSize: "0.85rem" }}
              onClick={async () => {
                if (!token) return;
                await api.rateStaff(token, s.id, 5);
              }}
            >
              Rate 5★
            </button>
          </div>
        ))}
      </div>
    </Shell>
  );
}
