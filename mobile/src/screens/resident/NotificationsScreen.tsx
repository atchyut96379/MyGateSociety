import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import type { Notification } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Card, Muted, Screen, Subtitle } from "../../components/ui";

export function NotificationsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);

  const load = useCallback(() => {
    if (token) api.notifications(token).then(setItems);
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function markRead(id: string) {
    if (!token) return;
    await api.markNotificationRead(token, id);
    load();
  }

  return (
    <Screen>
      {items.map((n) => (
        <Card key={n.id}>
          <Subtitle>{n.title}{!n.read ? " · NEW" : ""}</Subtitle>
          <Text>{n.body}</Text>
          <Muted>{new Date(n.created_at).toLocaleString()}</Muted>
          {!n.read && <Text onPress={() => markRead(n.id)} style={{ color: "#0d6e4f", marginTop: 8 }}>Mark read</Text>}
        </Card>
      ))}
      {items.length === 0 && <Card><Muted>No notifications.</Muted></Card>}
    </Screen>
  );
}
