import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { SocietyEvent } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentEvents() {
  const { token } = useAuth();
  const [items, setItems] = useState<SocietyEvent[]>([]);

  useEffect(() => {
    if (token) api.events(token).then(setItems);
  }, [token]);

  return (
    <Shell title="Events" nav={RESIDENT_NAV}>
      {items.map((ev) => (
        <div key={ev.id} className="card">
          <strong>{ev.title}</strong>
          {ev.location && <p className="muted">📍 {ev.location}</p>}
          <p className="muted">{new Date(ev.starts_at).toLocaleString()}</p>
          {ev.body && <p>{ev.body}</p>}
        </div>
      ))}
      {items.length === 0 && <p className="muted">No upcoming events.</p>}
    </Shell>
  );
}
