import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import type { MoveRequest } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, Field, Muted, Screen, Subtitle } from "../../components/ui";
import { colors } from "../../theme";

export function MovesScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<MoveRequest[]>([]);
  const [type, setType] = useState<"MOVE_IN" | "MOVE_OUT">("MOVE_IN");
  const [moveDate, setMoveDate] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(() => {
    if (token) api.moves(token).then(setItems);
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function submit() {
    if (!token || !moveDate) return;
    await api.createMove(token, { type, move_date: moveDate, notes: notes || undefined });
    setNotes("");
    load();
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Submit request</Subtitle>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
          {(["MOVE_IN", "MOVE_OUT"] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: type === t ? colors.primary : "#fff",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ color: type === t ? "#fff" : colors.text }}>
                {t === "MOVE_IN" ? "Move in" : "Move out"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field label="Date (YYYY-MM-DD)" value={moveDate} onChangeText={setMoveDate} />
        <Field label="Notes" value={notes} onChangeText={setNotes} multiline />
        <Button label="Submit" onPress={submit} />
      </Card>
      {items.map((m) => (
        <Card key={m.id}>
          <Subtitle>{m.type.replace("_", " ")}</Subtitle>
          <Muted>{m.status} · {m.move_date}{m.flat_label ? ` · Flat ${m.flat_label}` : ""}</Muted>
          {m.notes ? <Text>{m.notes}</Text> : null}
        </Card>
      ))}
    </Screen>
  );
}
