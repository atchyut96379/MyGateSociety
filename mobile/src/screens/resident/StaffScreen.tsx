import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { Staff } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function StaffScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Staff[]>([]);
  const [name, setName] = useState("");
  const [staffType, setStaffType] = useState("Maid");
  const [error, setError] = useState("");
  const [newStaff, setNewStaff] = useState<Staff | null>(null);

  const load = useCallback(() => {
    if (token) api.staff(token).then(setItems);
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function register() {
    if (!token || !name.trim()) return;
    setError("");
    try {
      const s = await api.createStaff(token, { name: name.trim(), staff_type: staffType });
      setNewStaff(s);
      setName("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  return (
    <Screen>
      {newStaff && (
        <Card>
          <Subtitle>{newStaff.name} registered</Subtitle>
          <Text style={{ fontSize: 28, fontWeight: "800", letterSpacing: 4 }}>{newStaff.passcode}</Text>
          <Muted>Daily gate passcode</Muted>
        </Card>
      )}
      <Card>
        <Subtitle>Register staff</Subtitle>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Type (Maid, Cook, Driver…)" value={staffType} onChangeText={setStaffType} />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Register" onPress={register} />
      </Card>
      {items.map((s) => (
        <Card key={s.id}>
          <Subtitle>{s.name}</Subtitle>
          <Text style={{ fontSize: 22, fontWeight: "800", letterSpacing: 3 }}>{s.passcode}</Text>
          <Muted>{s.staff_type} · {s.active ? "Active" : "Inactive"}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
