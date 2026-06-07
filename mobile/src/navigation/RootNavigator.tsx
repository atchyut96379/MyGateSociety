import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../auth/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { colors } from "../theme";
import { AdminNavigator } from "./AdminNavigator";
import { ResidentNavigator } from "./ResidentNavigator";
import { SecurityNavigator } from "./SecurityNavigator";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700" as const },
};

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={headerOptions}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : user.role === "RESIDENT" ? (
          <Stack.Screen
            name="ResidentRoot"
            component={ResidentNavigator}
            options={{ headerShown: false }}
          />
        ) : user.role === "SECURITY" ? (
          <Stack.Screen
            name="SecurityRoot"
            component={SecurityNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="AdminRoot"
            component={AdminNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
