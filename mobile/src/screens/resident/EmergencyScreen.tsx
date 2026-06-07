import { useCallback, useState } from "react";
import { Linking, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import type { EmergencyContact } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Card, Muted, Screen, Subtitle } from "../../components/ui";

export function EmergencyScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<EmergencyContact[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (token) api.emergencyContacts(token).then(setItems);
    }, [token])
  );

  return (
    <Screen>
      {items.map((c) => (
        <Card key={c.id}>
          <Subtitle>{c.name}</Subtitle>
          <Muted>{c.role}</Muted>
          <Text style={{ color: "#0d6e4f", fontSize: 18, fontWeight: "600" }} onPress={() => Linking.openURL(`tel:${c.phone}`)}>
            {c.phone}
          </Text>
        </Card>
      ))}
      {items.length === 0 && <Card><Muted>No emergency contacts configured.</Muted></Card>}
    </Screen>
  );
}
