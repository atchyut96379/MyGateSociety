export type ResidentStackParamList = {
  ResidentTabs: undefined;
  Notices: undefined;
  Visitors: undefined;
  Deliveries: undefined;
  Bills: undefined;
  Complaints: undefined;
  Sos: undefined;
  Staff: undefined;
  Vehicles: undefined;
  KidsExit: undefined;
  Notifications: undefined;
  Amenities: undefined;
  Polls: undefined;
  Events: undefined;
  Documents: undefined;
  Moves: undefined;
  Directory: undefined;
  Emergency: undefined;
  Accounts: undefined;
  ChangePassword: undefined;
};

export type ResidentTabParamList = {
  Home: undefined;
  Visitors: undefined;
  Deliveries: undefined;
  More: undefined;
  Profile: undefined;
};

export type SecurityStackParamList = {
  GuardHome: undefined;
  Profile: undefined;
  ChangePassword: undefined;
};

export type AdminTabParamList = {
  Home: undefined;
  Gate: undefined;
  GateLog: undefined;
  More: undefined;
  Profile: undefined;
};

export type AdminStackParamList = {
  AdminTabs: undefined;
  Collection: undefined;
  Finance: undefined;
  Complaints: undefined;
  Notices: undefined;
  GateLookup: undefined;
  GateLogs: undefined;
  Users: undefined;
  Flats: undefined;
  CreateUser: { userId?: string } | undefined;
  CreateGuard: undefined;
  SosAlerts: undefined;
  Amenities: undefined;
  Polls: undefined;
  Events: undefined;
  Documents: undefined;
  Moves: undefined;
  Emergency: undefined;
  Notifications: undefined;
  ChangePassword: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  ResidentRoot: undefined;
  SecurityRoot: undefined;
  AdminRoot: undefined;
};
