import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import type { SocietyEvent } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Card, Muted, Screen, Subtitle } from "../../components/ui";

export function EventsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<SocietyEvent[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (token) api.events(token).then(setItems);
    }, [token])
  );

  return (
    <Screen>
      {items.map((e) => (
        <Card key={e.id}>
          <Subtitle>{e.title}</Subtitle>
          {e.body ? <Text>{e.body}</Text> : null}
          <Muted>
            {new Date(e.starts_at).toLocaleString()}
            {e.location ? ` · ${e.location}` : ""}
          </Muted>
        </Card>
      ))}
      {items.length === 0 && <Card><Muted>No upcoming events.</Muted></Card>}
    </Screen>
  );
}
