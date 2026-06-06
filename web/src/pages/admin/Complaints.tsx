import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Complaint } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

export default function AdminComplaints() {
  const { token } = useAuth();
  const [items, setItems] = useState<Complaint[]>([]);

  function load() {
    if (token) api.complaints(token).then(setItems);
  }

  useEffect(() => { load(); }, [token]);

  async function resolve(id: string) {
    if (!token) return;
    await api.updateComplaint(token, id, { status: "RESOLVED", admin_note: "Resolved by admin" });
    load();
  }

  return (
    <Shell title="Helpdesk" nav={ADMIN_NAV}>
      {items.length === 0 ? (
        <p className="muted">No open complaints</p>
      ) : (
        items.map((c) => (
          <div key={c.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{c.subject}</strong>
              <span className="badge badge-amber">{c.status}</span>
            </div>
            <p className="muted">{c.flat_label} · {c.user_name}</p>
            <p>{c.body}</p>
            {c.status === "OPEN" && (
              <button type="button" className="btn" onClick={() => resolve(c.id)}>
                Mark resolved
              </button>
            )}
          </div>
        ))
      )}
    </Shell>
  );
}
