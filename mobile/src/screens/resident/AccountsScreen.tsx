import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../../api/client";
import type { AccountsSummary } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Card, Muted, Screen, Subtitle } from "../../components/ui";
import { colors } from "../../theme";

export function AccountsScreen() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<AccountsSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (token) api.accountsSummary(token).then(setSummary);
    }, [token])
  );

  return (
    <Screen>
      {summary && (
        <Card>
          <Subtitle>Society accounts</Subtitle>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.primary }}>
            ₹{summary.balance.toLocaleString("en-IN")}
          </Text>
          <Muted>Collected ₹{summary.total_collected.toLocaleString("en-IN")}</Muted>
          <Muted>Expenses ₹{summary.total_expenses.toLocaleString("en-IN")}</Muted>
          <Muted>{summary.pending_bills} pending bills · {summary.flat_count} flats</Muted>
        </Card>
      )}
    </Screen>
  );
}
