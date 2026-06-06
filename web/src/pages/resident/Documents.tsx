import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Document } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentDocuments() {
  const { token } = useAuth();
  const [items, setItems] = useState<Document[]>([]);

  useEffect(() => {
    if (token) api.documents(token).then(setItems);
  }, [token]);

  return (
    <Shell title="Documents" nav={RESIDENT_NAV}>
      {items.map((d) => (
        <div key={d.id} className="card">
          <strong>{d.title}</strong>
          <span className="badge" style={{ marginLeft: "0.5rem" }}>{d.category}</span>
          {d.body && <p>{d.body}</p>}
          {d.file_url && (
            <a href={d.file_url} target="_blank" rel="noreferrer">Open file</a>
          )}
        </div>
      ))}
      {items.length === 0 && <p className="muted">No documents published yet.</p>}
    </Shell>
  );
}
