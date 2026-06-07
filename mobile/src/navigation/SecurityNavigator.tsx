import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ChangePasswordScreen } from "../screens/shared/ChangePasswordScreen";
import { GuardHomeScreen } from "../screens/security/GuardHomeScreen";
import { colors } from "../theme";
import type { SecurityStackParamList } from "./types";

const Stack = createNativeStackNavigator<SecurityStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700" as const },
};

export function SecurityNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="GuardHome" component={GuardHomeScreen} options={{ title: "Gate console" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Change password" }} />
    </Stack.Navigator>
  );
}
