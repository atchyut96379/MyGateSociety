import { useCallback, useState } from "react";
import { Linking, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import type { Document } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Card, Muted, Screen, Subtitle } from "../../components/ui";

export function DocumentsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Document[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (token) api.documents(token).then(setItems);
    }, [token])
  );

  return (
    <Screen>
      {items.map((d) => (
        <Card key={d.id}>
          <Subtitle>{d.title}</Subtitle>
          <Muted>{d.category}</Muted>
          {d.body ? <Text>{d.body}</Text> : null}
          {d.file_url ? (
            <Text style={{ color: "#0d6e4f", marginTop: 8 }} onPress={() => Linking.openURL(d.file_url!)}>
              Open file
            </Text>
          ) : null}
        </Card>
      ))}
      {items.length === 0 && <Card><Muted>No documents.</Muted></Card>}
    </Screen>
  );
}
