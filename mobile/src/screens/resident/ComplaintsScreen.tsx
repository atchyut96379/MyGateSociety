import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { Complaint } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function ComplaintsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Complaint[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (token) api.complaints(token).then(setItems);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function submit() {
    if (!token || !subject.trim() || !body.trim()) {
      setError("Enter subject and description");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.createComplaint(token, {
        subject: subject.trim(),
        body: body.trim(),
        category: "General",
      });
      setSubject("");
      setBody("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>New complaint</Subtitle>
        <Field label="Subject" value={subject} onChangeText={setSubject} />
        <Field label="Description" value={body} onChangeText={setBody} multiline />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Submit" onPress={submit} loading={loading} />
      </Card>

      {items.map((c) => (
        <Card key={c.id}>
          <Subtitle>{c.subject}</Subtitle>
          <Text>{c.body}</Text>
          <Muted>
            {c.status} · {c.category} · {new Date(c.created_at).toLocaleString()}
          </Muted>
        </Card>
      ))}
    </Screen>
  );
}
