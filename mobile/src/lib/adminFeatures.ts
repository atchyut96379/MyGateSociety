import type { AdminStackParamList } from "../navigation/types";

export type AdminFeature = {
  icon: string;
  title: string;
  subtitle: string;
  route: keyof AdminStackParamList;
  secretaryOnly?: boolean;
};

export const ADMIN_HOME_FEATURES: AdminFeature[] = [
  { icon: "🧾", title: "Collection", subtitle: "Maintenance by flat", route: "Collection" },
  { icon: "📊", title: "Finance", subtitle: "Balance & expenses", route: "Finance" },
  { icon: "🛠️", title: "Helpdesk", subtitle: "Complaints", route: "Complaints" },
  { icon: "📢", title: "Notices", subtitle: "Post updates", route: "Notices" },
  { icon: "👥", title: "Users", subtitle: "All accounts", route: "Users" },
  { icon: "🏢", title: "All flats", subtitle: "Flat list", route: "Flats" },
];

export const ADMIN_MORE_FEATURES: AdminFeature[] = [
  { icon: "➕", title: "Create resident", subtitle: "New login", route: "CreateUser", secretaryOnly: true },
  { icon: "🛡️", title: "Create guard", subtitle: "Gate security", route: "CreateGuard", secretaryOnly: true },
  { icon: "🧾", title: "Collection", subtitle: "Pending maintenance", route: "Collection" },
  { icon: "📊", title: "Finance", subtitle: "Accounts", route: "Finance" },
  { icon: "🛠️", title: "Helpdesk", subtitle: "Complaints", route: "Complaints" },
  { icon: "📢", title: "Notices", subtitle: "Updates", route: "Notices" },
  { icon: "👥", title: "Users", subtitle: "User list", route: "Users" },
  { icon: "🏢", title: "Flats", subtitle: "All flats", route: "Flats" },
  { icon: "🚧", title: "Gate lookup", subtitle: "OTP verify", route: "GateLookup" },
  { icon: "📋", title: "Gate logs", subtitle: "Today", route: "GateLogs" },
  { icon: "🚨", title: "SOS alerts", subtitle: "Emergency", route: "SosAlerts" },
  { icon: "🏊", title: "Amenities", subtitle: "Manage", route: "Amenities" },
  { icon: "🗳️", title: "Polls", subtitle: "Create polls", route: "Polls" },
  { icon: "📅", title: "Events", subtitle: "Calendar", route: "Events" },
  { icon: "📄", title: "Documents", subtitle: "Upload info", route: "Documents" },
  { icon: "📋", title: "Move requests", subtitle: "Approve", route: "Moves" },
  { icon: "🆘", title: "Emergency", subtitle: "Contacts", route: "Emergency" },
  { icon: "🔔", title: "Alerts", subtitle: "Notifications", route: "Notifications" },
  { icon: "🔑", title: "Change password", subtitle: "Security", route: "ChangePassword" },
];
