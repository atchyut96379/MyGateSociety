import { useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentSos() {
  const { token } = useAuth();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function raise() {
    if (!token) return;
    await api.raiseSos(token, message || undefined);
    setSent(true);
    setMessage("");
  }

  return (
    <Shell title="Security alert" nav={RESIDENT_NAV}>
      <div className="card" style={{ textAlign: "center" }}>
        <p style={{ fontSize: "3rem", margin: "0.5rem 0" }}>🚨</p>
        <h2>Raise SOS</h2>
        <p className="muted">Guard will receive a loud alert immediately</p>
        <div className="field" style={{ textAlign: "left" }}>
          <label>Message (optional)</label>
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Need help at flat…" />
        </div>
        <button type="button" className="btn btn-danger btn-lg btn-block" onClick={raise}>
          RAISE ALARM
        </button>
        {sent && <p style={{ color: "var(--success)", marginTop: "1rem" }}>Alert sent to security</p>}
      </div>
    </Shell>
  );
}
