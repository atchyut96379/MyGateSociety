import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Poll } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

export default function AdminPolls() {
  const { token } = useAuth();
  const [items, setItems] = useState<Poll[]>([]);
  const [question, setQuestion] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [options, setOptions] = useState("Yes\nNo");

  function load() {
    if (token) api.polls(token).then(setItems);
  }

  useEffect(() => { load(); }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api.createPoll(token, {
      question,
      ends_at: new Date(endsAt).toISOString(),
      options: options.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    setQuestion("");
    setEndsAt("");
    load();
  }

  return (
    <Shell title="Polls" nav={ADMIN_NAV}>
      <form onSubmit={onSubmit} className="card">
        <h3>Create poll</h3>
        <div className="field">
          <label>Question</label>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} required />
        </div>
        <div className="field">
          <label>Ends at</label>
          <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
        </div>
        <div className="field">
          <label>Options (one per line)</label>
          <textarea value={options} onChange={(e) => setOptions(e.target.value)} rows={4} required />
        </div>
        <button type="submit" className="btn btn-block">Publish poll</button>
      </form>

      {items.map((p) => (
        <div key={p.id} className="card">
          <strong>{p.question}</strong>
          <p className="muted">Ends {new Date(p.ends_at).toLocaleString()}</p>
          {p.options.map((o) => (
            <p key={o.id} style={{ margin: "0.25rem 0" }}>
              {o.text} — <strong>{o.vote_count}</strong> votes
            </p>
          ))}
        </div>
      ))}
    </Shell>
  );
}
