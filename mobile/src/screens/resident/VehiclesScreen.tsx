import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { Vehicle } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function VehiclesScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Vehicle[]>([]);
  const [number, setNumber] = useState("");
  const [type, setType] = useState("Car");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (token) api.vehicles(token).then(setItems);
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function add() {
    if (!token || !number.trim()) return;
    setError("");
    try {
      await api.createVehicle(token, { number: number.trim().toUpperCase(), type });
      setNumber("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Register vehicle</Subtitle>
        <Field label="Number plate" value={number} onChangeText={setNumber} autoCapitalize="characters" />
        <Field label="Type" value={type} onChangeText={setType} />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Add vehicle" onPress={add} />
      </Card>
      {items.map((v) => (
        <Card key={v.id}>
          <Subtitle>{v.number}</Subtitle>
          <Muted>{v.type}{v.color ? ` · ${v.color}` : ""}{v.sticker_no ? ` · Sticker ${v.sticker_no}` : ""}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
