import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { SocietyEvent } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function AdminEventsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<SocietyEvent[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (token) api.events(token).then(setItems);
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function create() {
    if (!token || !title.trim() || !startsAt) {
      setError("Title and start time required");
      return;
    }
    setError("");
    try {
      await api.createEvent(token, {
        title: title.trim(),
        body: body.trim() || undefined,
        location: location.trim() || undefined,
        starts_at: new Date(startsAt).toISOString(),
      });
      setTitle("");
      setBody("");
      setLocation("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>New event</Subtitle>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Details" value={body} onChangeText={setBody} multiline />
        <Field label="Location" value={location} onChangeText={setLocation} />
        <Field label="Starts (YYYY-MM-DDTHH:MM)" value={startsAt} onChangeText={setStartsAt} />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Publish" onPress={create} />
      </Card>
      {items.map((e) => (
        <Card key={e.id}>
          <Subtitle>{e.title}</Subtitle>
          {e.body ? <Text>{e.body}</Text> : null}
          <Muted>{new Date(e.starts_at).toLocaleString()}{e.location ? ` · ${e.location}` : ""}</Muted>
        </Card>
      ))}
    </Screen>
  );
}
