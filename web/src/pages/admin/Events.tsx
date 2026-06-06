import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { SocietyEvent } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

export default function AdminEvents() {
  const { token } = useAuth();
  const [items, setItems] = useState<SocietyEvent[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");

  function load() {
    if (token) api.events(token).then(setItems);
  }

  useEffect(() => { load(); }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api.createEvent(token, {
      title,
      body: body || undefined,
      location: location || undefined,
      starts_at: new Date(startsAt).toISOString(),
    });
    setTitle("");
    setBody("");
    setLocation("");
    load();
  }

  return (
    <Shell title="Events" nav={ADMIN_NAV}>
      <form onSubmit={onSubmit} className="card">
        <h3>Post event</h3>
        <div className="field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label>Details</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="field">
          <label>Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="field">
          <label>Starts at</label>
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-block">Create event</button>
      </form>

      {items.map((ev) => (
        <div key={ev.id} className="card">
          <strong>{ev.title}</strong>
          {ev.location && <p className="muted">📍 {ev.location}</p>}
          <p className="muted">{new Date(ev.starts_at).toLocaleString()}</p>
          {ev.body && <p>{ev.body}</p>}
        </div>
      ))}
    </Shell>
  );
}
