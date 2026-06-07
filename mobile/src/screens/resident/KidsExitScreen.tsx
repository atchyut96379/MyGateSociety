import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import type { KidExit } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function KidsExitScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<KidExit[]>([]);
  const [childName, setChildName] = useState("");

  const load = useCallback(() => {
    if (token) api.kidsExit(token).then(setItems);
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function create() {
    if (!token || !childName.trim()) return;
    await api.createKidExit(token, { child_name: childName.trim() });
    setChildName("");
    load();
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Pre-approve child exit</Subtitle>
        <Field label="Child name" value={childName} onChangeText={setChildName} />
        <Button label="Create request" onPress={create} />
      </Card>
      {items.map((k) => (
        <Card key={k.id}>
          <Subtitle>{k.child_name}</Subtitle>
          <Muted>{k.status}</Muted>
          {k.status === "PENDING_APPROVAL" && token && (
            <>
              <Button label="Approve" onPress={() => api.approveKidExit(token, k.id).then(load)} />
              <Button label="Deny" variant="secondary" onPress={() => api.denyKidExit(token, k.id).then(load)} />
            </>
          )}
          {k.otp ? <Text style={{ fontSize: 24, fontWeight: "800", letterSpacing: 3 }}>{k.otp}</Text> : null}
        </Card>
      ))}
    </Screen>
  );
}
