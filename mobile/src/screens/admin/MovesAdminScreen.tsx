import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { MoveRequest } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Muted, Screen, Subtitle } from "../../components/ui";

export function AdminMovesScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<MoveRequest[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (token) api.moves(token).then(setItems);
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function setStatus(id: string, status: string) {
    if (!token) return;
    setError("");
    try {
      await api.updateMove(token, id, status);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  return (
    <Screen>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {items.map((m) => (
        <Card key={m.id}>
          <Subtitle>{m.type.replace("_", " ")}</Subtitle>
          <Muted>
            {m.status} · Flat {m.flat_label ?? "—"} · {m.user_name ?? ""}
          </Muted>
          <Muted>{m.move_date}</Muted>
          {m.notes ? <Text>{m.notes}</Text> : null}
          {m.status === "PENDING" && (
            <>
              <Button label="Approve" onPress={() => setStatus(m.id, "APPROVED")} />
              <Button label="Reject" variant="danger" onPress={() => setStatus(m.id, "REJECTED")} />
            </>
          )}
        </Card>
      ))}
      {items.length === 0 && <Card><Muted>No move requests.</Muted></Card>}
    </Screen>
  );
}
