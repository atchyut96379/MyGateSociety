import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, api } from "../../api/client";
import type { Poll } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, ErrorText, Field, Muted, Screen, Subtitle } from "../../components/ui";

export function AdminPollsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Poll[]>([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState("Yes\nNo");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (token) api.polls(token).then(setItems);
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function create() {
    if (!token || !question.trim()) return;
    const opts = options.split("\n").map((t) => t.trim()).filter(Boolean);
    if (opts.length < 2) {
      setError("Enter at least 2 options (one per line)");
      return;
    }
    setError("");
    try {
      await api.createPoll(token, {
        question: question.trim(),
        options: opts,
        ends_at: endsAt ? new Date(endsAt).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      setQuestion("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed");
    }
  }

  return (
    <Screen>
      <Card>
        <Subtitle>Create poll</Subtitle>
        <Field label="Question" value={question} onChangeText={setQuestion} />
        <Field label="Options (one per line)" value={options} onChangeText={setOptions} multiline />
        <Field label="Ends at (YYYY-MM-DDTHH:MM optional)" value={endsAt} onChangeText={setEndsAt} />
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button label="Publish poll" onPress={create} />
      </Card>
      {items.map((p) => (
        <Card key={p.id}>
          <Subtitle>{p.question}</Subtitle>
          <Muted>Ends {new Date(p.ends_at).toLocaleString()}</Muted>
          {p.options.map((o) => <Muted key={o.id}>{o.text}: {o.vote_count}</Muted>)}
        </Card>
      ))}
    </Screen>
  );
}
