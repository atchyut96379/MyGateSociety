import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { Amenity } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function AdminAmenitiesScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Amenity[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (token) api.amenities(token).then(setItems);
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function add() {
    if (!token || !name.trim()) return;
    setError("");
    try {
      await api.createAmenity(token, { name: name.trim(), description: description.trim() || undefined });
      setName("");
      setDescription("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Add amenity</Subtitle>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Description" value={description} onChangeText={setDescription} />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Add" onPress={add} />
      </Card>
      {items.map((a) => (
        <Card key={a.id}>
          <Subtitle>{a.name}</Subtitle>
          {a.description ? <Muted>{a.description}</Muted> : null}
          <Muted>{a.open_time && a.close_time ? `${a.open_time} – ${a.close_time}` : ""}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
