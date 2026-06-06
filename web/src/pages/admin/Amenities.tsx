import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Amenity, Booking } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { ADMIN_NAV } from "../../lib/nav";

export default function AdminAmenities() {
  const { token } = useAuth();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function load() {
    if (!token) return;
    api.amenities(token).then(setAmenities);
    api.bookings(token).then(setBookings);
  }

  useEffect(() => { load(); }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    await api.createAmenity(token, { name, description: description || undefined });
    setName("");
    setDescription("");
    load();
  }

  return (
    <Shell title="Amenities" nav={ADMIN_NAV}>
      <form onSubmit={onSubmit} className="card">
        <h3>Add amenity</h3>
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-block">Create</button>
      </form>

      <h3>Amenities</h3>
      {amenities.map((a) => (
        <div key={a.id} className="card">
          <strong>{a.name}</strong>
          {a.description && <p className="muted">{a.description}</p>}
        </div>
      ))}

      <h3>Bookings</h3>
      {bookings.map((b) => (
        <div key={b.id} className="card">
          <strong>{b.amenity_name}</strong>
          <span className="badge" style={{ marginLeft: "0.5rem" }}>{b.status}</span>
          <p className="muted" style={{ margin: 0 }}>
            Flat {b.flat_label} · {new Date(b.slot_start).toLocaleString()} – {new Date(b.slot_end).toLocaleTimeString()}
          </p>
        </div>
      ))}
    </Shell>
  );
}
