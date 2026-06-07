import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import type { Notice } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Card, Muted, Screen, Subtitle } from "../../components/ui";

export function NoticesScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Notice[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (token) api.notices(token).then(setItems);
    }, [token])
  );

  return (
    <Screen>
      {items.map((n) => (
        <Card key={n.id}>
          <Subtitle>
            {n.pinned ? "📌 " : ""}
            {n.title}
          </Subtitle>
          <Text>{n.body}</Text>
          <Muted>
            {n.author_name ?? "Society"} · {new Date(n.created_at).toLocaleString()}
          </Muted>
        </Card>
      ))}
      {items.length === 0 && (
        <Card>
          <Muted>No notices yet.</Muted>
        </Card>
      )}
    </Screen>
  );
}
