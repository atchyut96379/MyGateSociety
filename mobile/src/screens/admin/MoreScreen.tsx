import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../auth/AuthContext";
import { FeatureTile, Muted, Screen, Subtitle } from "../../components/ui";
import { ADMIN_MORE_FEATURES } from "../../lib/adminFeatures";
import type { AdminStackParamList } from "../../navigation/types";

export function AdminMoreScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();

  const features = ADMIN_MORE_FEATURES.filter(
    (f) => !f.secretaryOnly || user?.is_main_admin
  );

  return (
    <Screen>
      <Subtitle>All modules</Subtitle>
      <Muted>Secretary & committee tools on mobile</Muted>
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
      <Muted>
        Excel bulk import is easiest on www.marvelrocks.in on a computer. Online payments and PDF receipts work in the app build (preview APK).
      </Muted>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginTop: 8,
  },
});
