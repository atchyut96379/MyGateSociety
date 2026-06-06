import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Vehicle } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentVehicles() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [number, setNumber] = useState("");
  const [type, setType] = useState("Car");

  useEffect(() => {
    if (token) api.vehicles(token).then(setVehicles);
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api.createVehicle(token, { number, type });
    setNumber("");
    api.vehicles(token).then(setVehicles);
  }

  return (
    <Shell title="Vehicles" nav={RESIDENT_NAV}>
      <form onSubmit={onSubmit} className="card">
        <h3>Register vehicle</h3>
        <div className="field">
          <label>Number plate</label>
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="KA01AB1234" required />
        </div>
        <div className="field">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option>Car</option>
            <option>Bike</option>
            <option>Scooter</option>
          </select>
        </div>
        <button type="submit" className="btn btn-block">Add vehicle</button>
      </form>

      <div className="card">
        <h3>Registered vehicles</h3>
        {vehicles.length === 0 ? (
          <p className="muted">None yet</p>
        ) : (
          vehicles.map((v) => (
            <div key={v.id} className="list-row">
              <span><strong>{v.number}</strong> · {v.type}</span>
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}
