import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Poll } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentPolls() {
  const { token } = useAuth();
  const [items, setItems] = useState<Poll[]>([]);

  function load() {
    if (token) api.polls(token).then(setItems);
  }

  useEffect(() => { load(); }, [token]);

  async function vote(pollId: string, optionId: string) {
    if (!token) return;
    await api.votePoll(token, pollId, optionId);
    load();
  }

  return (
    <Shell title="Polls" nav={RESIDENT_NAV}>
      {items.map((p) => (
        <div key={p.id} className="card">
          <strong>{p.question}</strong>
          <p className="muted">Ends {new Date(p.ends_at).toLocaleString()}</p>
          {p.options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="btn btn-block"
              style={{ marginTop: "0.5rem", opacity: p.user_voted_option_id ? 0.7 : 1 }}
              disabled={!!p.user_voted_option_id}
              onClick={() => vote(p.id, o.id)}
            >
              {o.text} ({o.vote_count})
              {p.user_voted_option_id === o.id ? " ✓" : ""}
            </button>
          ))}
        </div>
      ))}
      {items.length === 0 && <p className="muted">No active polls.</p>}
    </Shell>
  );
}
