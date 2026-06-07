import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { Notice } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function AdminNoticesScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Notice[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (token) api.notices(token).then(setItems);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function post() {
    if (!token || !title.trim() || !body.trim()) {
      setError("Enter title and message");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.createNotice(token, { title: title.trim(), body: body.trim(), pinned: false });
      setTitle("");
      setBody("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not post notice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Post notice</Subtitle>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Message" value={body} onChangeText={setBody} multiline />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Publish" onPress={post} loading={loading} />
      </Card>

      {items.map((n) => (
        <Card key={n.id}>
          <Subtitle>{n.title}</Subtitle>
          <Text>{n.body}</Text>
          <Muted>{new Date(n.created_at).toLocaleString()}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
