import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { Notice } from "../api/types";
import { useAuth } from "../auth/AuthContext";

export function NoticeBoard({
  noticesHref,
  limit,
  compact = false,
}: {
  noticesHref: string;
  limit?: number;
  compact?: boolean;
}) {
  const { token } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.notices(token).then((list) => {
      setNotices(limit ? list.slice(0, limit) : list);
      setLoading(false);
    });
  }, [token, limit]);

  if (loading || notices.length === 0) return null;

  return (
    <section className="notice-board" style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h3 style={{ margin: 0 }}>📢 Society notices</h3>
        <Link to={noticesHref} style={{ fontSize: "0.875rem" }}>
          All notices →
        </Link>
      </div>
      {notices.map((n) => (
        <div
          key={n.id}
          className={`card notice-card ${n.pinned ? "notice-pinned" : ""}`}
          style={{ marginBottom: compact ? "0.5rem" : "0.75rem" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "flex-start" }}>
            <strong style={{ fontSize: compact ? "0.95rem" : "1.05rem" }}>{n.title}</strong>
            {n.pinned && <span className="badge badge-amber">Pinned</span>}
          </div>
          <p
            style={{
              margin: "0.35rem 0 0",
              whiteSpace: "pre-wrap",
              fontSize: compact ? "0.875rem" : "1rem",
              ...(compact ? { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } : {}),
            }}
          >
            {n.body}
          </p>
          <p className="muted" style={{ fontSize: "0.75rem", margin: "0.35rem 0 0" }}>
            {n.author_name ? `${n.author_name} · ` : ""}
            {new Date(n.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </section>
  );
}
