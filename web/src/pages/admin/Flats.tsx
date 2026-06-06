import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import type { Flat } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

export default function AdminFlats() {
  const { token } = useAuth();
  const [flats, setFlats] = useState<Flat[]>([]);

  useEffect(() => {
    if (token) api.flats(token).then(setFlats);
  }, [token]);

  const byFloor = useMemo(() => {
    const map = new Map<number, Flat[]>();
    for (const f of flats) {
      const list = map.get(f.floor) ?? [];
      list.push(f);
      map.set(f.floor, list);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [flats]);

  return (
    <Shell title="All flats" nav={ADMIN_NAV}>
      <p className="muted">
        5 floors · 19 doors per floor · duplex units <strong>109/110</strong> through{" "}
        <strong>509/510</strong> count as one home each ({flats.length} total).
      </p>

      {byFloor.map(([floor, items]) => (
        <div key={floor} className="card">
          <h3>Floor {floor}</h3>
          <div className="feature-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))" }}>
            {items.map((f) => (
              <div
                key={f.id}
                className="feature-tile"
                style={{ padding: "0.5rem", minHeight: "auto", cursor: "default" }}
                title={f.is_merged ? `Merged: ${f.physical_units}` : undefined}
              >
                <div className="title" style={{ fontSize: "0.9rem" }}>{f.label}</div>
                {f.is_merged && <div className="desc" style={{ fontSize: "0.65rem" }}>duplex</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Shell>
  );
}
