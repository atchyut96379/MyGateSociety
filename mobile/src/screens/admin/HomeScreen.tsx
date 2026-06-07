import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../../api/client";
import type { AccountsSummary, RealtimeSummary } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Card, FeatureTile, Muted, Screen, Title } from "../../components/ui";
import { ADMIN_HOME_FEATURES } from "../../lib/adminFeatures";
import type { AdminStackParamList, AdminTabParamList } from "../../navigation/types";
import { colors } from "../../theme";

type AdminHomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<AdminTabParamList, "Home">,
  NativeStackNavigationProp<AdminStackParamList>
>;

export function AdminHomeScreen() {
  const { user, token } = useAuth();
  const navigation = useNavigation<AdminHomeNav>();
  const [summary, setSummary] = useState<AccountsSummary | null>(null);
  const [live, setLive] = useState<RealtimeSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      api.accountsSummary(token).then(setSummary).catch(() => setSummary(null));
      api.realtimeSummary(token).then(setLive).catch(() => setLive(null));
    }, [token])
  );

  const roleLabel = user?.is_main_admin
    ? "Secretary"
    : user?.committee_role
      ? user.committee_role.replace(/_/g, " ")
      : "Committee";

  const features = ADMIN_HOME_FEATURES.filter(
    (f) => !f.secretaryOnly || user?.is_main_admin
  );

  return (
    <Screen>
      <Title>Flat {user?.flat_label ?? "—"}</Title>
      <Muted>
        Hi {user?.name} · {roleLabel}
      </Muted>

      {live && (live.pending_bills > 0 || live.unread_notifications > 0) && (
        <Card>
          {live.pending_bills > 0 && (
            <Text style={styles.alert}>
              {live.pending_bills} society bill{live.pending_bills > 1 ? "s" : ""} pending
            </Text>
          )}
          {live.unread_notifications > 0 && (
            <Text style={styles.alert}>{live.unread_notifications} new alerts</Text>
          )}
        </Card>
      )}

      {summary && (
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Muted>Balance</Muted>
            <Text style={styles.statValue}>₹{summary.balance.toLocaleString("en-IN")}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Muted>Pending bills</Muted>
            <Text style={styles.statValue}>{summary.pending_bills}</Text>
          </Card>
        </View>
      )}

      <Text style={styles.section}>Services</Text>
      <View style={styles.grid}>
        {features.map((f) => (
          <FeatureTile
            key={f.route}
            icon={f.icon}
            title={f.title}
            subtitle={f.subtitle}
            onPress={() => navigation.navigate(f.route)}
          />
        ))}
      </View>

      <Muted>Use the More tab for gate tools, SOS, and create logins.</Muted>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 4,
  },
  section: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  alert: {
    color: colors.warning,
    fontWeight: "600",
    marginBottom: 4,
  },
});
