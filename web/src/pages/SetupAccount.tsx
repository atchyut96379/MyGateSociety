import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { Flat, SetupVehicleInput } from "../api/types";
import { useAuth } from "../auth/AuthContext";

const VEHICLE_TYPES = ["Car", "Bike", "Scooter", "Other"];

function homeForRole(role: string) {
  if (role === "ADMIN" || role === "COMMITTEE") return "/admin";
  if (role === "SECURITY") return "/security";
  return "/resident";
}

function emptyVehicle(): SetupVehicleInput {
  return { number: "", type: "Car", color: "" };
}

export default function SetupAccountPage() {
  const { token, user, refresh, applyToken } = useAuth();
  const navigate = useNavigate();
  const [flats, setFlats] = useState<Flat[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [flatId, setFlatId] = useState("");
  const [vehicles, setVehicles] = useState<SetupVehicleInput[]>([emptyVehicle()]);
  const [showInDirectory, setShowInDirectory] = useState(true);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isResident = user?.role === "RESIDENT";
  const isSecretaryBootstrap = user?.is_main_admin && user?.phone?.toLowerCase() === "admin";
  const needsFlat = isResident || isSecretaryBootstrap;
  const needsMobile = isResident || isSecretaryBootstrap;
  const showVehicles = isResident || isSecretaryBootstrap;

  useEffect(() => {
    if (token) api.flats(token).then(setFlats);
  }, [token]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setContactPhone(user.phone.toLowerCase() === "admin" ? "" : user.phone);
      if (user.flat_id) setFlatId(user.flat_id);
    }
  }, [user]);

  useEffect(() => {
    if (user && !user.must_change_password) {
      navigate(homeForRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  function updateVehicle(index: number, field: keyof SetupVehicleInput, value: string) {
    setVehicles((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  function addVehicle() {
    setVehicles((prev) => [...prev, emptyVehicle()]);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }
    if (next.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (needsFlat && !flatId) {
      setError("Please select your flat");
      return;
    }
    if (needsMobile && !contactPhone.trim()) {
      setError("Mobile number is required — it becomes your login ID");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const vehiclePayload = vehicles.filter((v) => v.number.trim());
      const res = await api.completeSetup(token, {
        current_password: current,
        new_password: next,
        name,
        email: email || undefined,
        contact_phone: needsMobile ? contactPhone : undefined,
        flat_id: needsFlat ? flatId : undefined,
        show_in_directory: showInDirectory,
        vehicles: showVehicles && vehiclePayload.length > 0 ? vehiclePayload : undefined,
      });
      applyToken(res.access_token);
      await refresh();
      navigate(homeForRole(res.user.role), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container setup-page">
      <form onSubmit={onSubmit} className="card setup-card">
        <h2 style={{ marginTop: 0 }}>First login setup</h2>

        <div className="field">
          <label>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        {needsMobile && (
          <div className="field">
            <label>Mobile (login ID)</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="10-digit mobile"
              required
            />
          </div>
        )}

        <div className="field">
          <label>Email (optional)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        {needsFlat && (
          <div className="field">
            <label>Your flat</label>
            <select value={flatId} onChange={(e) => setFlatId(e.target.value)} required>
              <option value="">Select flat…</option>
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}{f.is_merged ? " (duplex)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {showVehicles && (
          <fieldset className="vehicle-fieldset">
            <legend>Vehicle details</legend>
            {vehicles.map((vehicle, index) => (
              <div key={index} className="vehicle-row">
                <div className="field">
                  <label>Registration no.</label>
                  <input
                    value={vehicle.number}
                    onChange={(e) => updateVehicle(index, "number", e.target.value)}
                    placeholder="e.g. AP39NC1234"
                  />
                </div>
                <div className="field">
                  <label>Type</label>
                  <select
                    value={vehicle.type ?? "Car"}
                    onChange={(e) => updateVehicle(index, "type", e.target.value)}
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Color</label>
                  <input
                    value={vehicle.color ?? ""}
                    onChange={(e) => updateVehicle(index, "color", e.target.value)}
                    placeholder="e.g. blue"
                  />
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-outline" onClick={addVehicle}>
              + Add another vehicle
            </button>
          </fieldset>
        )}

        {(isResident || isSecretaryBootstrap) && (
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
            <input
              type="checkbox"
              checked={showInDirectory}
              onChange={(e) => setShowInDirectory(e.target.checked)}
            />
            Show in intercom directory
          </label>
        )}

        <div className="field">
          <label>Current password (from society office)</label>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>New password</label>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-block btn-lg" disabled={loading}>
          {loading ? "Saving…" : "Save & continue"}
        </button>
      </form>
    </div>
  );
}
