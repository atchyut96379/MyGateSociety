import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Notification } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentNotifications() {
  const { token } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);

  function load() {
    if (token) api.notifications(token).then(setItems);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [token]);

  async function markRead(id: string) {
    if (!token) return;
    await api.markNotificationRead(token, id);
    load();
  }

  return (
    <Shell title="Alerts" nav={RESIDENT_NAV}>
      {items.map((n) => (
        <div
          key={n.id}
          className="card"
          style={{ opacity: n.read ? 0.7 : 1 }}
          onClick={() => !n.read && markRead(n.id)}
          role="button"
          tabIndex={0}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{n.title}</strong>
            {!n.read && <span className="badge">New</span>}
          </div>
          <p>{n.body}</p>
          <p className="muted" style={{ margin: 0 }}>
            {new Date(n.created_at).toLocaleString()}
          </p>
        </div>
      ))}
      {items.length === 0 && <p className="muted">No notifications.</p>}
    </Shell>
  );
}
