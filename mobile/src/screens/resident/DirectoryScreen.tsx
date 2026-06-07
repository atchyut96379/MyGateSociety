import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import type { DirectoryEntry } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Card, Muted, Screen, Subtitle } from "../../components/ui";

export function DirectoryScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<DirectoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (token) api.directory(token).then(setItems);
    }, [token])
  );

  return (
    <Screen>
      {items.filter((d) => d.show_in_directory).map((d) => (
        <Card key={d.id}>
          <Subtitle>{d.display_name}</Subtitle>
          <Muted>Flat {d.flat_label ?? "—"}</Muted>
          {d.phone ? <Muted>{d.phone}</Muted> : null}
        </Card>
      ))}
      {items.length === 0 && <Card><Muted>Directory is empty.</Muted></Card>}
    </Screen>
  );
}
