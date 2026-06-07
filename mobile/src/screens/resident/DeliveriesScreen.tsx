import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { Delivery } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Muted, Screen, Subtitle } from "../../components/ui";

export function DeliveriesScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Delivery[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (token) api.deliveries(token).then(setItems);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function setStatus(id: string, status: string) {
    if (!token) return;
    setError("");
    try {
      await api.updateDelivery(token, id, status);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  return (
    <Screen>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {items.map((d) => (
        <Card key={d.id}>
          <Subtitle>{d.company}</Subtitle>
          <Text style={{ fontSize: 24, fontWeight: "800", letterSpacing: 3 }}>{d.otp}</Text>
          <Muted>{d.status}{d.description ? ` · ${d.description}` : ""}</Muted>
          {d.status === "PENDING" && (
            <>
              <Button label="Approve" onPress={() => setStatus(d.id, "APPROVED")} />
              <Button label="Deny" variant="danger" onPress={() => setStatus(d.id, "DENIED")} />
            </>
          )}
        </Card>
      ))}
      {items.length === 0 && (
        <Card>
          <Muted>No deliveries.</Muted>
        </Card>
      )}
    </Screen>
  );
}
