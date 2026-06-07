import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { SosAlert } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Muted, Screen, Subtitle } from "../../components/ui";

export function AdminSosAlertsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<SosAlert[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (token) api.sosAlerts(token).then(setItems);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function resolve(id: string) {
    if (!token) return;
    setError("");
    try {
      await api.resolveSos(token, id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not resolve");
    }
  }

  return (
    <Screen>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {items.map((s) => (
        <Card key={s.id}>
          <Subtitle>Flat {s.flat_label ?? "—"}</Subtitle>
          <Text>{s.message ?? "Emergency SOS"}</Text>
          <Muted>
            {s.status} · {new Date(s.created_at).toLocaleString()}
          </Muted>
          {s.status === "OPEN" && (
            <Button label="Mark resolved" onPress={() => resolve(s.id)} />
          )}
        </Card>
      ))}
      {items.length === 0 && (
        <Card>
          <Muted>No SOS alerts.</Muted>
        </Card>
      )}
    </Screen>
  );
}
