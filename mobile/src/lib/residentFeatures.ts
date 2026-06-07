import type { ResidentStackParamList } from "../navigation/types";

export type ResidentFeature = {
  icon: string;
  title: string;
  subtitle: string;
  route: keyof ResidentStackParamList;
};

export const RESIDENT_HOME_FEATURES: ResidentFeature[] = [
  { icon: "📢", title: "Notices", subtitle: "Society updates", route: "Notices" },
  { icon: "👤", title: "Visitors", subtitle: "Invite with OTP", route: "Visitors" },
  { icon: "📦", title: "Deliveries", subtitle: "Approve / deny", route: "Deliveries" },
  { icon: "🧹", title: "Domestic staff", subtitle: "Daily passcode", route: "Staff" },
  { icon: "🚗", title: "Vehicles", subtitle: "Register car/bike", route: "Vehicles" },
  { icon: "🧾", title: "Maintenance", subtitle: "View bills", route: "Bills" },
];

export const RESIDENT_MORE_FEATURES: ResidentFeature[] = [
  { icon: "📢", title: "Notices", subtitle: "Society board", route: "Notices" },
  { icon: "🧹", title: "Domestic staff", subtitle: "Gate passcode", route: "Staff" },
  { icon: "🚗", title: "Vehicles", subtitle: "Your vehicles", route: "Vehicles" },
  { icon: "🧾", title: "My Payments", subtitle: "Maintenance", route: "Bills" },
  { icon: "🏊", title: "Amenities", subtitle: "Book slots", route: "Amenities" },
  { icon: "🗳️", title: "Polls", subtitle: "Vote", route: "Polls" },
  { icon: "📅", title: "Events", subtitle: "Society calendar", route: "Events" },
  { icon: "📄", title: "Documents", subtitle: "Bylaws & forms", route: "Documents" },
  { icon: "📋", title: "Move in/out", subtitle: "Requests", route: "Moves" },
  { icon: "📞", title: "Directory", subtitle: "Neighbour contacts", route: "Directory" },
  { icon: "🛠️", title: "Helpdesk", subtitle: "Complaints", route: "Complaints" },
  { icon: "👧", title: "Kids exit", subtitle: "Gate approval", route: "KidsExit" },
  { icon: "🚨", title: "SOS", subtitle: "Emergency", route: "Sos" },
  { icon: "🆘", title: "Emergency", subtitle: "Important numbers", route: "Emergency" },
  { icon: "📊", title: "Accounts", subtitle: "Society summary", route: "Accounts" },
  { icon: "🔔", title: "Alerts", subtitle: "Notifications", route: "Notifications" },
  { icon: "🔑", title: "Change password", subtitle: "Security", route: "ChangePassword" },
];
