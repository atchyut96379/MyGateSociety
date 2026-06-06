import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { GateLogEntry } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

type Tab = "visitors" | "staff" | "deliveries";

function formatTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function LogTable({ rows, empty }: { rows: GateLogEntry[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="muted">{empty}</p>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid var(--border)" }}>
            <th style={{ padding: "0.5rem" }}>Name</th>
            <th style={{ padding: "0.5rem" }}>Flat</th>
            <th style={{ padding: "0.5rem" }}>Check in</th>
            <th style={{ padding: "0.5rem" }}>Check out</th>
            <th style={{ padding: "0.5rem" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "0.5rem" }}>
                {r.name}
                {r.detail ? <span className="muted"> · {r.detail}</span> : null}
              </td>
              <td style={{ padding: "0.5rem" }}>{r.flat_label ?? "—"}</td>
              <td style={{ padding: "0.5rem" }}>{formatTime(r.check_in)}</td>
              <td style={{ padding: "0.5rem" }}>{formatTime(r.check_out)}</td>
              <td style={{ padding: "0.5rem" }}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminGateLogs() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("visitors");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof api.dailyGateLogs>> | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError("");
    api
      .dailyGateLogs(token, date)
      .then(setLogs)
      .catch(() => setError("Could not load gate logs"))
      .finally(() => setLoading(false));
  }, [token, date]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "visitors", label: "Visitors", count: logs?.visitors.length ?? 0 },
    { id: "staff", label: "Staff", count: logs?.staff.length ?? 0 },
    { id: "deliveries", label: "Deliveries", count: logs?.deliveries.length ?? 0 },
  ];

  return (
    <Shell title="Gate daily logs" nav={ADMIN_NAV}>
      <p className="muted">
        Check-in and check-out times for visitors, domestic staff, and deliveries.
      </p>

      <div className="field" style={{ maxWidth: 220 }}>
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "1rem 0" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "btn" : "btn btn-secondary"}
            onClick={() => setTab(t.id)}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="card">
        {loading && <p className="muted">Loading…</p>}
        {error && <p className="error">{error}</p>}
        {!loading && logs && tab === "visitors" && (
          <LogTable rows={logs.visitors} empty="No visitor activity on this date." />
        )}
        {!loading && logs && tab === "staff" && (
          <LogTable rows={logs.staff} empty="No staff check-ins on this date." />
        )}
        {!loading && logs && tab === "deliveries" && (
          <LogTable rows={logs.deliveries} empty="No deliveries on this date." />
        )}
      </div>
    </Shell>
  );
}
