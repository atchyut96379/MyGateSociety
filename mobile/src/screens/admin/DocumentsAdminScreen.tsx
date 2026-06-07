import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { Document } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function AdminDocumentsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Document[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (token) api.documents(token).then(setItems);
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function add() {
    if (!token || !title.trim()) return;
    setError("");
    try {
      await api.createDocument(token, {
        title: title.trim(),
        category,
        body: body.trim() || undefined,
      });
      setTitle("");
      setBody("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Add document</Subtitle>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Category" value={category} onChangeText={setCategory} />
        <Field label="Text content" value={body} onChangeText={setBody} multiline />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Save" onPress={add} />
      </Card>
      {items.map((d) => (
        <Card key={d.id}>
          <Subtitle>{d.title}</Subtitle>
          <Muted>{d.category}</Muted>
          {d.body ? <Text>{d.body}</Text> : null}
        </Card>
      ))}
    </Screen>
  );
}
