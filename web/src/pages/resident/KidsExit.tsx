import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { KidExit } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentKidsExit() {
  const { token } = useAuth();
  const [items, setItems] = useState<KidExit[]>([]);
  const [childName, setChildName] = useState("");

  function load() {
    if (token) api.kidsExit(token).then(setItems);
  }

  useEffect(() => { load(); }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api.createKidExit(token, { child_name: childName });
    setChildName("");
    load();
  }

  return (
    <Shell title="Kids exit" nav={RESIDENT_NAV}>
      <form onSubmit={onSubmit} className="card">
        <h3>Pre-approve child exit</h3>
        <div className="field">
          <label>Child name</label>
          <input value={childName} onChange={(e) => setChildName(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-block">Create request</button>
      </form>

      {items.map((k) => (
        <div key={k.id} className="card">
          <div className="list-row">
            <strong>{k.child_name}</strong>
            <span className="badge">{k.status}</span>
          </div>
          {k.status === "PENDING_APPROVAL" && token && (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button type="button" className="btn" onClick={() => api.approveKidExit(token, k.id).then(load)}>
                Approve
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => api.denyKidExit(token, k.id).then(load)}>
                Deny
              </button>
            </div>
          )}
          {k.otp && (
            <div className="otp-display" style={{ fontSize: "1.25rem" }}>{k.otp}</div>
          )}
        </div>
      ))}
    </Shell>
  );
}
