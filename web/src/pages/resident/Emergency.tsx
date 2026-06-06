import { useEffect, useState } from "react";
import { api } from "../../api/client";
import type { EmergencyContact } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentEmergency() {
  const { token } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    if (token) api.emergencyContacts(token).then(setContacts);
  }, [token]);

  return (
    <Shell title="Emergency" nav={RESIDENT_NAV}>
      {contacts.length === 0 ? (
        <p className="muted">Run seed to load emergency contacts.</p>
      ) : (
        contacts.map((c) => (
          <div key={c.id} className="card">
            <strong>{c.name}</strong>
            <p className="muted" style={{ margin: "0.25rem 0" }}>{c.role}</p>
            <a href={`tel:${c.phone}`} style={{ fontSize: "1.25rem", fontWeight: 700 }}>
              {c.phone}
            </a>
          </div>
        ))
      )}
    </Shell>
  );
}
