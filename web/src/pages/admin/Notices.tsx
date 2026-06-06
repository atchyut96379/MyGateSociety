import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Notice } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ApiError } from "../../api/client";
import { ADMIN_NAV } from "../../lib/nav";

export default function AdminNotices() {
  const { token, user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  function load() {
    if (!token) return;
    api.notices(token).then(setNotices);
  }

  useEffect(() => {
    load();
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError("");
    try {
      await api.createNotice(token, { title, body, pinned });
      setTitle("");
      setBody("");
      setPinned(false);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to post notice");
    }
  }

  return (
    <Shell title="Notices" nav={ADMIN_NAV}>
      {user?.role === "ADMIN" && (
        <button
          type="button"
          className="btn"
          style={{ marginBottom: "1rem" }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Post notice"}
        </button>
      )}

      {showForm && (
        <form onSubmit={onSubmit} className="card">
          <div className="field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="field">
            <label>Body</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin to top
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-block">
            Publish
          </button>
        </form>
      )}

      {notices.length === 0 ? (
        <p className="muted">No notices yet.</p>
      ) : (
        notices.map((n) => (
          <div key={n.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
              <h3 style={{ margin: 0 }}>{n.title}</h3>
              {n.pinned && <span className="badge badge-amber">Pinned</span>}
            </div>
            <p style={{ whiteSpace: "pre-wrap", margin: "0.5rem 0" }}>{n.body}</p>
            <p className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>
              {n.author_name ?? "Admin"} · {new Date(n.created_at).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </Shell>
  );
}
