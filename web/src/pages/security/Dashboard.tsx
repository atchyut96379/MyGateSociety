import { useEffect, useState } from "react";
import { ApiError, api } from "../../api/client";
import type { Delivery, GateLookup, SosAlert, Vehicle, Visitor } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { GuardShell } from "../../components/Shell";

export default function SecurityDashboard() {
  const { token } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [sosAlerts, setSosAlerts] = useState<SosAlert[]>([]);
  const [otpInput, setOtpInput] = useState("");
  const [lookup, setLookup] = useState<GateLookup | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [last4, setLast4] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  function reload() {
    if (!token) return;
    api.visitors(token).then(setVisitors);
    api.deliveries(token).then(setDeliveries);
    api.sosAlerts(token).then(setSosAlerts);
  }

  useEffect(() => {
    reload();
    const t = setInterval(reload, 5000);
    return () => clearInterval(t);
  }, [token]);

  useEffect(() => {
    if (!token || otpInput.length !== 6) {
      setLookup(null);
      setLookupError("");
      return;
    }
    api
      .gateLookup(token, otpInput)
      .then((r) => {
        setLookup(r);
        setLookupError("");
      })
      .catch((e) => {
        setLookup(null);
        setLookupError(e instanceof ApiError ? e.message : "Not found");
      });
  }, [otpInput, token]);

  function appendDigit(d: string) {
    if (otpInput.length < 6) setOtpInput((p) => p + d);
  }

  async function actionCheckIn() {
    if (!token || !lookup || lookup.type !== "visitor") return;
    const id = lookup.record.id as string;
    await api.checkInVisitor(token, id);
    setOtpInput("");
    reload();
  }

  async function actionCheckOut(visitorId?: string) {
    const id = visitorId ?? (lookup?.type === "visitor" ? (lookup.record.id as string) : "");
    if (!token || !id) return;
    await api.checkOutVisitor(token, id);
    setOtpInput("");
    reload();
  }

  async function actionDelivery(status: string) {
    if (!token || !lookup || lookup.type !== "delivery") return;
    const id = lookup.record.id as string;
    await api.updateDelivery(token, id, status);
    setOtpInput("");
    reload();
  }

  async function actionStaffCheckIn() {
    if (!token || !lookup || lookup.type !== "staff") return;
    const id = lookup.record.id as string;
    await api.staffCheckIn(token, id);
    setOtpInput("");
  }

  async function searchVehicle() {
    if (!token || last4.length !== 4) return;
    setVehicles(await api.vehicles(token, last4));
  }

  return (
    <GuardShell title="Gate — Passcode pad">
      {sosAlerts.length > 0 && (
        <div className="card" style={{ background: "#fef2f2", borderColor: "#fca5a5", animation: "pulse 1s infinite" }}>
          <h3 style={{ color: "var(--danger)", margin: 0 }}>🚨 ACTIVE SOS ({sosAlerts.length})</h3>
          {sosAlerts.map((a) => (
            <div key={a.id} className="list-row">
              <span>Flat <strong>{a.flat_label}</strong> — {a.user_name}</span>
              <button type="button" className="btn btn-secondary" onClick={() => token && api.resolveSos(token, a.id).then(reload)}>
                Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <p className="muted" style={{ textAlign: "center", margin: 0 }}>Enter 6-digit OTP</p>
        <div className="otp-display" style={{ fontSize: "2rem" }}>{otpInput.padEnd(6, "·")}</div>
        <div className="guard-pad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key === "C") setOtpInput("");
                else if (key === "⌫") setOtpInput((p) => p.slice(0, -1));
                else appendDigit(key);
              }}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {lookup && (
        <div className="card" style={{ background: "#ecfdf5" }}>
          <h3 style={{ marginTop: 0 }}>
            {lookup.type === "visitor" && "✅ Visitor"}
            {lookup.type === "delivery" && "📦 Delivery"}
            {lookup.type === "staff" && "🧹 Staff"}
            {lookup.type === "kid" && "👧 Kid exit"}
          </h3>
          <p style={{ margin: 0 }}>
            {lookup.type === "visitor" && (
              <>
                <strong>{String(lookup.record.guest_name)}</strong>
                <br />Flat {String(lookup.record.flat_label)}
              </>
            )}
            {lookup.type === "delivery" && (
              <>
                <strong>{String(lookup.record.company)}</strong>
                <br />Flat {String(lookup.record.flat_label)} · {String(lookup.record.mode)}
              </>
            )}
            {lookup.type === "staff" && (
              <>
                <strong>{String(lookup.record.name)}</strong> ({String(lookup.record.staff_type)})
                <br />Flat {String(lookup.record.flat_label)}
              </>
            )}
            {lookup.type === "kid" && (
              <>
                <strong>{String(lookup.record.child_name)}</strong>
                <br />Flat {String(lookup.record.flat_label)}
              </>
            )}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            {lookup.type === "visitor" && (
              lookup.record.status === "CHECKED_IN" ? (
                <button type="button" className="btn btn-danger" onClick={() => actionCheckOut()}>
                  Check out
                </button>
              ) : (
                <button type="button" className="btn" onClick={actionCheckIn}>Check in</button>
              )
            )}
            {lookup.type === "delivery" && (
              <>
                <button type="button" className="btn" onClick={() => actionDelivery("DELIVERED")}>Delivered</button>
                <button type="button" className="btn btn-secondary" onClick={() => actionDelivery("LEFT_AT_GATE")}>Left at gate</button>
              </>
            )}
            {lookup.type === "staff" && (
              <button type="button" className="btn" onClick={actionStaffCheckIn}>Check in staff</button>
            )}
          </div>
        </div>
      )}

      {lookupError && otpInput.length === 6 && (
        <p className="error" style={{ textAlign: "center" }}>{lookupError}</p>
      )}

      <div className="card">
        <h3>Vehicle lookup (last 4 digits)</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            maxLength={4}
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
            placeholder="1234"
            style={{ flex: 1, padding: "0.65rem", borderRadius: 8, border: "1px solid var(--border)" }}
          />
          <button type="button" className="btn" onClick={searchVehicle}>Find</button>
        </div>
        {vehicles.map((v) => (
          <div key={v.id} className="list-row">
            <span>{v.number} → Flat {v.flat_label}</span>
            {v.owner_phone && (
              <a href={`tel:${v.owner_phone}`} className="btn btn-secondary" style={{ padding: "0.35rem 0.65rem" }}>
                Call
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Visitors inside (check out)</h3>
        {visitors.filter((v) => v.status === "CHECKED_IN").length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>No visitors checked in right now.</p>
        ) : (
          visitors
            .filter((v) => v.status === "CHECKED_IN")
            .map((v) => (
              <div key={v.id} className="list-row">
                <span>{v.guest_name} → {v.flat_label}</span>
                <button type="button" className="btn btn-danger" onClick={() => actionCheckOut(v.id)}>
                  Check out
                </button>
              </div>
            ))
        )}
      </div>

      <div className="card">
        <h3>Expected visitors</h3>
        {visitors
          .filter((v) => v.status !== "CHECKED_IN" && v.status !== "CHECKED_OUT")
          .map((v) => (
          <div key={v.id} className="list-row">
            <span>{v.guest_name} → {v.flat_label}</span>
            <span className="badge badge-green">{v.otp}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Deliveries</h3>
        {deliveries.map((d) => (
          <div key={d.id} className="list-row">
            <span>{d.company} → {d.flat_label}</span>
            <span className="badge badge-amber">{d.otp}</span>
          </div>
        ))}
      </div>
    </GuardShell>
  );
}
