import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { MoveRequest } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentMoves() {
  const { token } = useAuth();
  const [items, setItems] = useState<MoveRequest[]>([]);
  const [type, setType] = useState("MOVE_IN");
  const [moveDate, setMoveDate] = useState("");
  const [notes, setNotes] = useState("");

  function load() {
    if (token) api.moves(token).then(setItems);
  }

  useEffect(() => { load(); }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api.createMove(token, {
      type,
      move_date: moveDate,
      notes: notes || undefined,
    });
    setNotes("");
    load();
  }

  return (
    <Shell title="Move in / out" nav={RESIDENT_NAV}>
      <form onSubmit={onSubmit} className="card">
        <h3>Submit request</h3>
        <div className="field">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="MOVE_IN">Move in</option>
            <option value="MOVE_OUT">Move out</option>
          </select>
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={moveDate} onChange={(e) => setMoveDate(e.target.value)} required />
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-block">Submit</button>
      </form>

      {items.map((m) => (
        <div key={m.id} className="card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{m.type.replace(/_/g, " ")}</strong>
            <span className="badge">{m.status}</span>
          </div>
          <p className="muted">{new Date(m.move_date).toLocaleDateString()}</p>
          {m.notes && <p>{m.notes}</p>}
        </div>
      ))}
    </Shell>
  );
}
