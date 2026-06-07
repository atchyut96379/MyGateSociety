import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { Complaint } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Muted, Screen, Subtitle } from "../../components/ui";

export function AdminComplaintsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Complaint[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (token) api.complaints(token).then(setItems);
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
      await api.updateComplaint(token, id, {
        status: "RESOLVED",
        admin_note: "Resolved from Android app",
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update");
    }
  }

  return (
    <Screen>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {items.map((c) => (
        <Card key={c.id}>
          <Subtitle>{c.subject}</Subtitle>
          <Muted>
            {c.flat_label ?? "—"} · {c.user_name ?? "Resident"} · {c.status}
          </Muted>
          <Text>{c.body}</Text>
          {c.status === "OPEN" && (
            <Button label="Mark resolved" onPress={() => resolve(c.id)} />
          )}
        </Card>
      ))}
      {items.length === 0 && (
        <Card>
          <Muted>No complaints.</Muted>
        </Card>
      )}
    </Screen>
  );
}
