import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { Visitor } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function VisitorsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Visitor[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (token) api.visitors(token).then(setItems);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function invite() {
    if (!token || !guestName.trim()) {
      setError("Enter guest name");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.createVisitor(token, {
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim() || undefined,
        purpose: purpose.trim() || undefined,
        visit_date: new Date().toISOString().slice(0, 10),
      });
      setGuestName("");
      setGuestPhone("");
      setPurpose("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create visitor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Invite visitor</Subtitle>
        <Field label="Guest name" value={guestName} onChangeText={setGuestName} />
        <Field label="Phone (optional)" value={guestPhone} onChangeText={setGuestPhone} keyboardType="phone-pad" />
        <Field label="Purpose (optional)" value={purpose} onChangeText={setPurpose} />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Generate OTP" onPress={invite} loading={loading} />
      </Card>

      {items.map((v) => (
        <Card key={v.id}>
          <Subtitle>{v.guest_name}</Subtitle>
          <Text style={{ fontSize: 28, fontWeight: "800", letterSpacing: 4 }}>{v.otp}</Text>
          <Muted>
            {v.status} · {v.visit_date}
            {v.purpose ? ` · ${v.purpose}` : ""}
          </Muted>
        </Card>
      ))}
    </Screen>
  );
}
