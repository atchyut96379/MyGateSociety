import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { EmergencyContact } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

export default function AdminEmergency() {
  const { token } = useAuth();
  const [items, setItems] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");

  function load() {
    if (token) api.emergencyContacts(token).then(setItems);
  }

  useEffect(() => { load(); }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api.createEmergencyContact(token, { name, role, phone });
    setName("");
    setRole("");
    setPhone("");
    load();
  }

  return (
    <Shell title="Emergency contacts" nav={ADMIN_NAV}>
      <form onSubmit={onSubmit} className="card">
        <h3>Add contact</h3>
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Role</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ambulance, Fire…" required />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-block">Save</button>
      </form>

      {items.map((c) => (
        <div key={c.id} className="card">
          <strong>{c.name}</strong>
          <p className="muted" style={{ margin: "0.25rem 0" }}>{c.role}</p>
          <a href={`tel:${c.phone}`}>{c.phone}</a>
        </div>
      ))}
    </Shell>
  );
}
