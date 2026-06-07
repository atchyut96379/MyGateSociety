import { useCallback, useState } from "react";
import { Linking, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { EmergencyContact } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function AdminEmergencyScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (token) api.emergencyContacts(token).then(setItems);
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function add() {
    if (!token || !name.trim() || !phone.trim()) return;
    setError("");
    try {
      await api.createEmergencyContact(token, {
        name: name.trim(),
        role: role.trim() || "Contact",
        phone: phone.trim(),
      });
      setName("");
      setRole("");
      setPhone("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Add contact</Subtitle>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Role" value={role} onChangeText={setRole} />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Add" onPress={add} />
      </Card>
      {items.map((c) => (
        <Card key={c.id}>
          <Subtitle>{c.name}</Subtitle>
          <Muted>{c.role}</Muted>
          <Text style={{ color: "#0d6e4f" }} onPress={() => Linking.openURL(`tel:${c.phone}`)}>{c.phone}</Text>
        </Card>
      ))}
    </Screen>
  );
}
