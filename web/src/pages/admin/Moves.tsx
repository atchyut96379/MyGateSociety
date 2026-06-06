import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { MoveRequest } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

export default function AdminMoves() {
  const { token } = useAuth();
  const [items, setItems] = useState<MoveRequest[]>([]);

  function load() {
    if (token) api.moves(token).then(setItems);
  }

  useEffect(() => { load(); }, [token]);

  async function setStatus(id: string, status: string) {
    if (!token) return;
    await api.updateMove(token, id, status);
    load();
  }

  return (
    <Shell title="Move in / out" nav={ADMIN_NAV}>
      {items.map((m) => (
        <div key={m.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{m.type.replace(/_/g, " ")}</strong>
            <span className="badge">{m.status}</span>
          </div>
          <p className="muted" style={{ margin: "0.25rem 0" }}>
            Flat {m.flat_label} · {m.user_name}
          </p>
          <p>Date: {new Date(m.move_date).toLocaleDateString()}</p>
          {m.notes && <p className="muted">{m.notes}</p>}
          {m.status === "PENDING" && (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button type="button" className="btn" onClick={() => setStatus(m.id, "APPROVED")}>Approve</button>
              <button type="button" className="btn btn-danger" onClick={() => setStatus(m.id, "REJECTED")}>Reject</button>
            </div>
          )}
        </div>
      ))}
      {items.length === 0 && <p className="muted">No move requests yet.</p>}
    </Shell>
  );
}
