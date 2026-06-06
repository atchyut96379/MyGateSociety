import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { DirectoryEntry } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentDirectory() {
  const { token, user } = useAuth();
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [show, setShow] = useState(true);

  function load() {
    if (token) api.directory(token).then(setEntries);
  }

  useEffect(() => {
    load();
    if (user) {
      setDisplayName(user.name);
      setPhone(user.phone);
    }
  }, [token, user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api.updateDirectory(token, {
      display_name: displayName,
      phone,
      show_in_directory: show,
    });
    load();
  }

  return (
    <Shell title="Intercom directory" nav={RESIDENT_NAV}>
      <form onSubmit={onSubmit} className="card">
        <h3>My listing</h3>
        <div className="field">
          <label>Display name</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          Show in directory
        </label>
        <button type="submit" className="btn btn-block" style={{ marginTop: "0.75rem" }}>Update</button>
      </form>

      <h3>Residents</h3>
      {entries.map((e) => (
        <div key={e.id} className="card">
          <strong>{e.display_name}</strong>
          {e.flat_label && <span className="muted"> · Flat {e.flat_label}</span>}
          {e.phone && (
            <p style={{ margin: "0.25rem 0 0" }}>
              <a href={`tel:${e.phone}`}>{e.phone}</a>
            </p>
          )}
        </div>
      ))}
    </Shell>
  );
}
