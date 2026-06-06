import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Notice } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentNotices() {
  const { token } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    if (!token) return;
    api.notices(token).then(setNotices);
  }, [token]);

  return (
    <Shell title="Notices" nav={RESIDENT_NAV}>
      {notices.length === 0 ? (
        <p className="muted">No notices from the society yet.</p>
      ) : (
        notices.map((n) => (
          <div key={n.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>{n.title}</h3>
              {n.pinned && <span className="badge badge-amber">Pinned</span>}
            </div>
            <p style={{ whiteSpace: "pre-wrap" }}>{n.body}</p>
            <p className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>
              {new Date(n.created_at).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </Shell>
  );
}
