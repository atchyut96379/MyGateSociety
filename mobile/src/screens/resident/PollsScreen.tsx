import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import type { Poll } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, Muted, Screen, Subtitle } from "../../components/ui";

export function PollsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<Poll[]>([]);

  const load = useCallback(() => {
    if (token) api.polls(token).then(setItems);
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function vote(pollId: string, optionId: string) {
    if (!token) return;
    await api.votePoll(token, pollId, optionId);
    load();
  }

  return (
    <Screen>
      {items.map((p) => (
        <Card key={p.id}>
          <Subtitle>{p.question}</Subtitle>
          <Muted>Ends {new Date(p.ends_at).toLocaleString()}</Muted>
          {p.options.map((o) => (
            <Button
              key={o.id}
              label={`${o.text} (${o.vote_count})${p.user_voted_option_id === o.id ? " ✓" : ""}`}
              variant={p.user_voted_option_id === o.id ? "primary" : "secondary"}
              disabled={!!p.user_voted_option_id}
              onPress={() => vote(p.id, o.id)}
            />
          ))}
        </Card>
      ))}
      {items.length === 0 && <Card><Muted>No active polls.</Muted></Card>}
    </Screen>
  );
}
