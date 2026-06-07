import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ChangePasswordScreen } from "../screens/shared/ChangePasswordScreen";
import { AccountsScreen } from "../screens/resident/AccountsScreen";
import { AmenitiesScreen } from "../screens/resident/AmenitiesScreen";
import { BillsScreen } from "../screens/resident/BillsScreen";
import { ComplaintsScreen } from "../screens/resident/ComplaintsScreen";
import { DeliveriesScreen } from "../screens/resident/DeliveriesScreen";
import { DirectoryScreen } from "../screens/resident/DirectoryScreen";
import { DocumentsScreen } from "../screens/resident/DocumentsScreen";
import { EmergencyScreen } from "../screens/resident/EmergencyScreen";
import { EventsScreen } from "../screens/resident/EventsScreen";
import { ResidentHomeScreen } from "../screens/resident/HomeScreen";
import { KidsExitScreen } from "../screens/resident/KidsExitScreen";
import { ResidentMoreScreen } from "../screens/resident/MoreScreen";
import { MovesScreen } from "../screens/resident/MovesScreen";
import { NotificationsScreen } from "../screens/resident/NotificationsScreen";
import { NoticesScreen } from "../screens/resident/NoticesScreen";
import { PollsScreen } from "../screens/resident/PollsScreen";
import { SosScreen } from "../screens/resident/SosScreen";
import { StaffScreen } from "../screens/resident/StaffScreen";
import { VehiclesScreen } from "../screens/resident/VehiclesScreen";
import { VisitorsScreen } from "../screens/resident/VisitorsScreen";
import { colors } from "../theme";
import type { ResidentStackParamList, ResidentTabParamList } from "./types";

const Tab = createBottomTabNavigator<ResidentTabParamList>();
const Stack = createNativeStackNavigator<ResidentStackParamList>();

const headerOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700" as const },
};

function tabIcon(emoji: string) {
  return ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}

function ResidentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
      }}
    >
      <Tab.Screen name="Home" component={ResidentHomeScreen} options={{ title: "Home", tabBarIcon: tabIcon("🏠") }} />
      <Tab.Screen name="Visitors" component={VisitorsScreen} options={{ title: "Visitors", tabBarIcon: tabIcon("👤") }} />
      <Tab.Screen name="Deliveries" component={DeliveriesScreen} options={{ title: "Delivery", tabBarIcon: tabIcon("📦") }} />
      <Tab.Screen name="More" component={ResidentMoreScreen} options={{ title: "More", tabBarIcon: tabIcon("☰") }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile", tabBarIcon: tabIcon("👤") }} />
    </Tab.Navigator>
  );
}

const stackScreens: { name: keyof ResidentStackParamList; component: React.ComponentType; title: string }[] = [
  { name: "Notices", component: NoticesScreen, title: "Notices" },
  { name: "Visitors", component: VisitorsScreen, title: "Visitors" },
  { name: "Deliveries", component: DeliveriesScreen, title: "Deliveries" },
  { name: "Bills", component: BillsScreen, title: "Maintenance" },
  { name: "Complaints", component: ComplaintsScreen, title: "Helpdesk" },
  { name: "Sos", component: SosScreen, title: "SOS" },
  { name: "Staff", component: StaffScreen, title: "Domestic staff" },
  { name: "Vehicles", component: VehiclesScreen, title: "Vehicles" },
  { name: "KidsExit", component: KidsExitScreen, title: "Kids exit" },
  { name: "Notifications", component: NotificationsScreen, title: "Alerts" },
  { name: "Amenities", component: AmenitiesScreen, title: "Amenities" },
  { name: "Polls", component: PollsScreen, title: "Polls" },
  { name: "Events", component: EventsScreen, title: "Events" },
  { name: "Documents", component: DocumentsScreen, title: "Documents" },
  { name: "Moves", component: MovesScreen, title: "Move in/out" },
  { name: "Directory", component: DirectoryScreen, title: "Directory" },
  { name: "Emergency", component: EmergencyScreen, title: "Emergency" },
  { name: "Accounts", component: AccountsScreen, title: "Accounts" },
  { name: "ChangePassword", component: ChangePasswordScreen, title: "Change password" },
];

export function ResidentNavigator() {
  return (
    <Stack.Navigator screenOptions={headerOptions}>
      <Stack.Screen name="ResidentTabs" component={ResidentTabs} options={{ headerShown: false }} />
      {stackScreens.map((s) => (
        <Stack.Screen key={s.name} name={s.name} component={s.component} options={{ title: s.title }} />
      ))}
    </Stack.Navigator>
  );
}
