import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { Amenity, Booking } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";
import { colors } from "../../theme";

export function AmenitiesScreen() {
  const { token } = useAuth();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [amenityId, setAmenityId] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!token) return;
    api.amenities(token).then((list) => {
      setAmenities(list);
      if (list.length && !amenityId) setAmenityId(list[0].id);
    });
    api.bookings(token).then(setBookings);
  }, [token, amenityId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function book() {
    if (!token || !amenityId || !slotStart || !slotEnd) {
      setError("Select amenity and enter start/end times (ISO format)");
      return;
    }
    setError("");
    try {
      await api.createBooking(token, {
        amenity_id: amenityId,
        slot_start: new Date(slotStart).toISOString(),
        slot_end: new Date(slotEnd).toISOString(),
        notes: notes || undefined,
      });
      setNotes("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Booking failed");
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Book amenity</Subtitle>
        <Muted>Select amenity</Muted>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {amenities.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setAmenityId(a.id)}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: amenityId === a.id ? colors.primary : "#fff",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: amenityId === a.id ? "#fff" : colors.text }}>{a.name}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Start (YYYY-MM-DDTHH:MM)" value={slotStart} onChangeText={setSlotStart} placeholder="2026-06-10T10:00" />
        <Field label="End (YYYY-MM-DDTHH:MM)" value={slotEnd} onChangeText={setSlotEnd} placeholder="2026-06-10T12:00" />
        <Field label="Notes" value={notes} onChangeText={setNotes} />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Book slot" onPress={book} />
      </Card>
      {bookings.map((b) => (
        <Card key={b.id}>
          <Subtitle>{b.amenity_name ?? "Booking"}</Subtitle>
          <Muted>
            {new Date(b.slot_start).toLocaleString()} – {new Date(b.slot_end).toLocaleString()}
          </Muted>
          <Muted>{b.status}{b.flat_label ? ` · Flat ${b.flat_label}` : ""}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
