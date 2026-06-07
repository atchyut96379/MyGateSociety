import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "../../api/client";
import type { RealtimeSummary } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Card, FeatureTile, Muted, Screen, Title } from "../../components/ui";
import { RESIDENT_HOME_FEATURES } from "../../lib/residentFeatures";
import type { ResidentStackParamList, ResidentTabParamList } from "../../navigation/types";
import { colors } from "../../theme";

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<ResidentTabParamList, "Home">,
  NativeStackNavigationProp<ResidentStackParamList>
>;

export function ResidentHomeScreen() {
  const { user, token } = useAuth();
  const navigation = useNavigation<HomeNav>();
  const [live, setLive] = useState<RealtimeSummary | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (token) api.realtimeSummary(token).then(setLive).catch(() => setLive(null));
    }, [token])
  );

  return (
    <Screen>
      <Title>Flat {user?.flat_label ?? "—"}</Title>
      <Muted>Hi {user?.name}</Muted>

      {live && live.pending_bills > 0 && (
        <Card>
          <FeatureTile
            icon="💳"
            title="Pay Now — maintenance pending"
            subtitle={`${live.pending_bills} unpaid bill${live.pending_bills > 1 ? "s" : ""} for Flat ${user?.flat_label ?? "—"}`}
            onPress={() => navigation.navigate("Bills")}
          />
        </Card>
      )}

      {live && (live.pending_deliveries > 0 || live.unread_notifications > 0) && (
        <Card>
          {live.pending_deliveries > 0 && <Text style={styles.alert}>{live.pending_deliveries} pending deliveries</Text>}
          {live.unread_notifications > 0 && <Text style={styles.alert}>{live.unread_notifications} new alerts</Text>}
        </Card>
      )}

      <Text style={styles.section}>Services</Text>
      <View style={styles.grid}>
        {RESIDENT_HOME_FEATURES.map((f) => (
          <FeatureTile
            key={f.route}
            icon={f.icon}
            title={f.title}
            subtitle={f.subtitle}
            onPress={() => navigation.navigate(f.route)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 18, fontWeight: "700", color: colors.text, marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  alert: { color: colors.warning, fontWeight: "600", marginBottom: 4 },
});
