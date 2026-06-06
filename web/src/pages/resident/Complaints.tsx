import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Complaint } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentComplaints() {
  const { token } = useAuth();
  const [items, setItems] = useState<Complaint[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function load() {
    if (token) api.complaints(token).then(setItems);
  }

  useEffect(() => { load(); }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api.createComplaint(token, { subject, body });
    setSubject("");
    setBody("");
    load();
  }

  return (
    <Shell title="Helpdesk" nav={RESIDENT_NAV}>
      <form onSubmit={onSubmit} className="card">
        <h3>Raise complaint</h3>
        <div className="field">
          <label>Subject</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
        </div>
        <div className="field">
          <label>Details</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-block">Submit</button>
      </form>

      {items.map((c) => (
        <div key={c.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{c.subject}</strong>
            <span className="badge">{c.status}</span>
          </div>
          <p>{c.body}</p>
          {c.admin_note && <p className="muted">Admin: {c.admin_note}</p>}
        </div>
      ))}
    </Shell>
  );
}
