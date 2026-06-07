import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import type { Flat } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Card, Muted, Screen, Subtitle } from "../../components/ui";

export function AdminFlatsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Flat[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (token) api.flats(token).then(setItems);
    }, [token])
  );

  return (
    <Screen>
      <Muted>{items.length} flats in society</Muted>
      {items.map((f) => (
        <Card key={f.id}>
          <Subtitle>Flat {f.label}</Subtitle>
          <Muted>
            Floor {f.floor}
            {f.is_merged && f.physical_units ? ` · Units ${f.physical_units}` : ""}
          </Muted>
        </Card>
      ))}
    </Screen>
  );
}
