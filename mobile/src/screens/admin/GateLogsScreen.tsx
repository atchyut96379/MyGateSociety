import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import type { DailyGateLogs } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Card, Muted, Screen, Subtitle } from "../../components/ui";

function LogSection({ title, entries }: { title: string; entries: DailyGateLogs["visitors"] }) {
  if (!entries.length) return null;
  return (
    <>
      <Subtitle>{title}</Subtitle>
      {entries.map((e) => (
        <Card key={`${e.type}-${e.id}`}>
          <Text style={{ fontWeight: "700" }}>{e.name}</Text>
          <Muted>
            Flat {e.flat_label ?? "—"} · {e.status}
            {e.check_in ? ` · In ${new Date(e.check_in).toLocaleTimeString()}` : ""}
            {e.check_out ? ` · Out ${new Date(e.check_out).toLocaleTimeString()}` : ""}
          </Muted>
          {e.detail ? <Muted>{e.detail}</Muted> : null}
        </Card>
      ))}
    </>
  );
}

export function AdminGateLogsScreen() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<DailyGateLogs | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (token) api.dailyGateLogs(token).then(setLogs);
    }, [token])
  );

  return (
    <Screen>
      <Muted>Date: {logs?.date ?? new Date().toISOString().slice(0, 10)}</Muted>
      <LogSection title="Visitors" entries={logs?.visitors ?? []} />
      <LogSection title="Staff" entries={logs?.staff ?? []} />
      <LogSection title="Deliveries" entries={logs?.deliveries ?? []} />
      {logs &&
        !logs.visitors.length &&
        !logs.staff.length &&
        !logs.deliveries.length && (
          <Card>
            <Muted>No gate activity logged today yet.</Muted>
          </Card>
        )}
    </Screen>
  );
}
