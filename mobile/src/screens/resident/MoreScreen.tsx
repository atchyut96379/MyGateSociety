import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FeatureTile, Muted, Screen, Subtitle } from "../../components/ui";
import { RESIDENT_MORE_FEATURES } from "../../lib/residentFeatures";
import type { ResidentStackParamList } from "../../navigation/types";

export function ResidentMoreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ResidentStackParamList>>();

  return (
    <Screen>
      <Subtitle>More services</Subtitle>
      <Muted>All resident features</Muted>
      <View style={styles.grid}>
        {RESIDENT_MORE_FEATURES.map((f) => (
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginTop: 8,
  },
});
