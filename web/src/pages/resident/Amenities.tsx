import { FormEvent, useEffect, useState } from "react";
import { api } from "../../api/client";
import type { Amenity, Booking } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentAmenities() {
  const { token } = useAuth();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [amenityId, setAmenityId] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [notes, setNotes] = useState("");

  function load() {
    if (!token) return;
    api.amenities(token).then((list) => {
      setAmenities(list);
      if (list.length && !amenityId) setAmenityId(list[0].id);
    });
    api.bookings(token).then(setBookings);
  }

  useEffect(() => { load(); }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !amenityId) return;
    await api.createBooking(token, {
      amenity_id: amenityId,
      slot_start: new Date(slotStart).toISOString(),
      slot_end: new Date(slotEnd).toISOString(),
      notes: notes || undefined,
    });
    setNotes("");
    load();
  }

  return (
    <Shell title="Amenities" nav={RESIDENT_NAV}>
      <form onSubmit={onSubmit} className="card">
        <h3>Book slot</h3>
        <div className="field">
          <label>Amenity</label>
          <select value={amenityId} onChange={(e) => setAmenityId(e.target.value)} required>
            {amenities.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>From</label>
          <input type="datetime-local" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} required />
        </div>
        <div className="field">
          <label>To</label>
          <input type="datetime-local" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} required />
        </div>
        <div className="field">
          <label>Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-block">Request booking</button>
      </form>

      <h3>My bookings</h3>
      {bookings.map((b) => (
        <div key={b.id} className="card">
          <strong>{b.amenity_name}</strong>
          <span className="badge" style={{ marginLeft: "0.5rem" }}>{b.status}</span>
          <p className="muted" style={{ margin: 0 }}>
            {new Date(b.slot_start).toLocaleString()} – {new Date(b.slot_end).toLocaleTimeString()}
          </p>
        </div>
      ))}
    </Shell>
  );
}
