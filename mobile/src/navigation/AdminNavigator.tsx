import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ChangePasswordScreen } from "../screens/shared/ChangePasswordScreen";
import { AdminAmenitiesScreen } from "../screens/admin/AmenitiesAdminScreen";
import { AdminCollectionScreen } from "../screens/admin/CollectionScreen";
import { AdminComplaintsScreen } from "../screens/admin/ComplaintsScreen";
import { AdminCreateGuardScreen } from "../screens/admin/CreateGuardScreen";
import { AdminCreateUserScreen } from "../screens/admin/CreateUserScreen";
import { AdminDocumentsScreen } from "../screens/admin/DocumentsAdminScreen";
import { AdminEmergencyScreen } from "../screens/admin/EmergencyAdminScreen";
import { AdminEventsScreen } from "../screens/admin/EventsAdminScreen";
import { AdminFinanceScreen } from "../screens/admin/FinanceScreen";
import { AdminFlatsScreen } from "../screens/admin/FlatsScreen";
import { AdminGateLogsScreen } from "../screens/admin/GateLogsScreen";
import { AdminHomeScreen } from "../screens/admin/HomeScreen";
import { AdminMoreScreen } from "../screens/admin/MoreScreen";
import { AdminMovesScreen } from "../screens/admin/MovesAdminScreen";
import { AdminNoticesScreen } from "../screens/admin/NoticesScreen";
import { AdminPollsScreen } from "../screens/admin/PollsAdminScreen";
import { AdminSosAlertsScreen } from "../screens/admin/SosAlertsScreen";
import { AdminUsersScreen } from "../screens/admin/UsersScreen";
import { NotificationsScreen } from "../screens/resident/NotificationsScreen";
import { GuardHomeScreen } from "../screens/security/GuardHomeScreen";
import { colors } from "../theme";
import type { AdminStackParamList, AdminTabParamList } from "./types";

const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700" as const },
};

function tabIcon(emoji: string) {
  return ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
      }}
    >
      <Tab.Screen name="Home" component={AdminHomeScreen} options={{ title: "Home", tabBarIcon: tabIcon("🏠") }} />
      <Tab.Screen name="Gate" component={GuardHomeScreen} options={{ title: "Gate", tabBarIcon: tabIcon("🚧") }} />
      <Tab.Screen name="GateLog" component={AdminGateLogsScreen} options={{ title: "Gate log", tabBarLabel: "Log", tabBarIcon: tabIcon("📋") }} />
      <Tab.Screen name="More" component={AdminMoreScreen} options={{ title: "More", tabBarIcon: tabIcon("☰") }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile", tabBarIcon: tabIcon("👤") }} />
    </Tab.Navigator>
  );
}

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Collection" component={AdminCollectionScreen} options={{ title: "Collection" }} />
      <Stack.Screen name="Finance" component={AdminFinanceScreen} options={{ title: "Finance" }} />
      <Stack.Screen name="Complaints" component={AdminComplaintsScreen} options={{ title: "Helpdesk" }} />
      <Stack.Screen name="Notices" component={AdminNoticesScreen} options={{ title: "Notices" }} />
      <Stack.Screen name="GateLookup" component={GuardHomeScreen} options={{ title: "Gate lookup" }} />
      <Stack.Screen name="GateLogs" component={AdminGateLogsScreen} options={{ title: "Gate logs" }} />
      <Stack.Screen name="Users" component={AdminUsersScreen} options={{ title: "Users" }} />
      <Stack.Screen name="Flats" component={AdminFlatsScreen} options={{ title: "All flats" }} />
      <Stack.Screen name="CreateUser" component={AdminCreateUserScreen} options={{ title: "Create resident" }} />
      <Stack.Screen name="CreateGuard" component={AdminCreateGuardScreen} options={{ title: "Create guard" }} />
      <Stack.Screen name="SosAlerts" component={AdminSosAlertsScreen} options={{ title: "SOS alerts" }} />
      <Stack.Screen name="Amenities" component={AdminAmenitiesScreen} options={{ title: "Amenities" }} />
      <Stack.Screen name="Polls" component={AdminPollsScreen} options={{ title: "Polls" }} />
      <Stack.Screen name="Events" component={AdminEventsScreen} options={{ title: "Events" }} />
      <Stack.Screen name="Documents" component={AdminDocumentsScreen} options={{ title: "Documents" }} />
      <Stack.Screen name="Moves" component={AdminMovesScreen} options={{ title: "Move requests" }} />
      <Stack.Screen name="Emergency" component={AdminEmergencyScreen} options={{ title: "Emergency" }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Alerts" }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: "Change password" }} />
    </Stack.Navigator>
  );
}
