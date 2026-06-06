import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Document } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

export default function AdminDocuments() {
  const { token } = useAuth();
  const [items, setItems] = useState<Document[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("BYLAWS");
  const [body, setBody] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  function load() {
    if (token) api.documents(token).then(setItems);
  }

  useEffect(() => { load(); }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api.createDocument(token, {
      title,
      category,
      body: body || undefined,
      file_url: fileUrl || undefined,
    });
    setTitle("");
    setBody("");
    setFileUrl("");
    load();
  }

  return (
    <Shell title="Documents" nav={ADMIN_NAV}>
      <form onSubmit={onSubmit} className="card">
        <h3>Upload document</h3>
        <div className="field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="BYLAWS">Bylaws</option>
            <option value="MINUTES">Minutes</option>
            <option value="FORMS">Forms</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="field">
          <label>File URL (optional)</label>
          <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="field">
          <label>Text content</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-block">Publish</button>
      </form>

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
    </Shell>
  );
}
