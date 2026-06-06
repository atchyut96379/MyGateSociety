import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "./auth/AuthContext";

import HomePage from "./pages/Home";

import LoginPage from "./pages/Login";
import ForgotPasswordPage from "./pages/ForgotPassword";

import ChangePasswordPage from "./pages/ChangePassword";
import SetupAccountPage from "./pages/SetupAccount";
import ProfilePage from "./pages/Profile";
import MyPaymentsPage from "./pages/MyPayments";

import AdminDashboard from "./pages/admin/Dashboard";

import AdminUsers from "./pages/admin/Users";

import AdminNewUser from "./pages/admin/NewUser";
import AdminNewGuard from "./pages/admin/NewGuard";

import AdminNotices from "./pages/admin/Notices";

import AdminComplaints from "./pages/admin/Complaints";

import AdminAccounts from "./pages/admin/Accounts";

import AdminMore from "./pages/admin/More";

import AdminBills from "./pages/admin/Bills";

import AdminFinance from "./pages/admin/Finance";

import AdminAmenities from "./pages/admin/Amenities";

import AdminPolls from "./pages/admin/Polls";

import AdminEvents from "./pages/admin/Events";

import AdminDocuments from "./pages/admin/Documents";

import AdminMoves from "./pages/admin/Moves";

import AdminEmergency from "./pages/admin/Emergency";
import AdminFlats from "./pages/admin/Flats";
import AdminGateLogs from "./pages/admin/GateLogs";

import ResidentDashboard from "./pages/resident/Dashboard";

import ResidentVisitors from "./pages/resident/Visitors";

import ResidentDeliveries from "./pages/resident/Deliveries";

import ResidentNotices from "./pages/resident/Notices";

import ResidentMore from "./pages/resident/More";

import ResidentStaff from "./pages/resident/Staff";

import ResidentVehicles from "./pages/resident/Vehicles";

import ResidentComplaints from "./pages/resident/Complaints";

import ResidentSos from "./pages/resident/Sos";

import ResidentKidsExit from "./pages/resident/KidsExit";

import ResidentEmergency from "./pages/resident/Emergency";

import ResidentAccounts from "./pages/resident/Accounts";

import ResidentBills from "./pages/resident/Bills";

import ResidentAmenities from "./pages/resident/Amenities";

import ResidentPolls from "./pages/resident/Polls";

import ResidentEvents from "./pages/resident/Events";

import ResidentDocuments from "./pages/resident/Documents";

import ResidentMoves from "./pages/resident/Moves";

import ResidentDirectory from "./pages/resident/Directory";

import ResidentNotifications from "./pages/resident/Notifications";

import SecurityDashboard from "./pages/security/Dashboard";



export default function App() {

  return (

    <Routes>

      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route path="/setup" element={<RequireAuth><SetupAccountPage /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/change-password" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />
      <Route path="/my-payments" element={<RequireAuth><MyPaymentsPage /></RequireAuth>} />



      <Route path="/admin" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminDashboard /></RequireAuth>} />

      <Route path="/admin/flats" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminFlats /></RequireAuth>} />
      <Route path="/admin/users" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminUsers /></RequireAuth>} />

      <Route path="/admin/users/new" element={<RequireAuth roles={["ADMIN"]}><AdminNewUser /></RequireAuth>} />
      <Route path="/admin/guards/new" element={<RequireAuth roles={["ADMIN"]}><AdminNewGuard /></RequireAuth>} />

      <Route path="/admin/notices" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminNotices /></RequireAuth>} />

      <Route path="/admin/complaints" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminComplaints /></RequireAuth>} />

      <Route path="/admin/accounts" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminAccounts /></RequireAuth>} />

      <Route path="/admin/more" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminMore /></RequireAuth>} />

      <Route path="/admin/bills" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminBills /></RequireAuth>} />

      <Route path="/admin/finance" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminFinance /></RequireAuth>} />

      <Route path="/admin/amenities" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminAmenities /></RequireAuth>} />

      <Route path="/admin/polls" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminPolls /></RequireAuth>} />

      <Route path="/admin/events" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminEvents /></RequireAuth>} />

      <Route path="/admin/documents" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminDocuments /></RequireAuth>} />

      <Route path="/admin/moves" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminMoves /></RequireAuth>} />

      <Route path="/admin/emergency" element={<RequireAuth roles={["ADMIN", "COMMITTEE"]}><AdminEmergency /></RequireAuth>} />

      <Route path="/admin/gate-logs" element={<RequireAuth roles={["ADMIN", "COMMITTEE", "SECURITY"]}><AdminGateLogs /></RequireAuth>} />



      <Route path="/resident" element={<RequireAuth roles={["RESIDENT"]}><ResidentDashboard /></RequireAuth>} />

      <Route path="/resident/visitors" element={<RequireAuth roles={["RESIDENT"]}><ResidentVisitors /></RequireAuth>} />

      <Route path="/resident/deliveries" element={<RequireAuth roles={["RESIDENT"]}><ResidentDeliveries /></RequireAuth>} />

      <Route path="/resident/notices" element={<RequireAuth roles={["RESIDENT"]}><ResidentNotices /></RequireAuth>} />

      <Route path="/resident/more" element={<RequireAuth roles={["RESIDENT"]}><ResidentMore /></RequireAuth>} />

      <Route path="/resident/staff" element={<RequireAuth roles={["RESIDENT"]}><ResidentStaff /></RequireAuth>} />

      <Route path="/resident/vehicles" element={<RequireAuth roles={["RESIDENT"]}><ResidentVehicles /></RequireAuth>} />

      <Route path="/resident/complaints" element={<RequireAuth roles={["RESIDENT"]}><ResidentComplaints /></RequireAuth>} />

      <Route path="/resident/sos" element={<RequireAuth roles={["RESIDENT"]}><ResidentSos /></RequireAuth>} />

      <Route path="/resident/kids" element={<RequireAuth roles={["RESIDENT"]}><ResidentKidsExit /></RequireAuth>} />

      <Route path="/resident/emergency" element={<RequireAuth roles={["RESIDENT"]}><ResidentEmergency /></RequireAuth>} />

      <Route path="/resident/accounts" element={<RequireAuth roles={["RESIDENT"]}><ResidentAccounts /></RequireAuth>} />

      <Route path="/resident/bills" element={<RequireAuth roles={["RESIDENT"]}><ResidentBills /></RequireAuth>} />

      <Route path="/resident/amenities" element={<RequireAuth roles={["RESIDENT"]}><ResidentAmenities /></RequireAuth>} />

      <Route path="/resident/polls" element={<RequireAuth roles={["RESIDENT"]}><ResidentPolls /></RequireAuth>} />

      <Route path="/resident/events" element={<RequireAuth roles={["RESIDENT"]}><ResidentEvents /></RequireAuth>} />

      <Route path="/resident/documents" element={<RequireAuth roles={["RESIDENT"]}><ResidentDocuments /></RequireAuth>} />

      <Route path="/resident/moves" element={<RequireAuth roles={["RESIDENT"]}><ResidentMoves /></RequireAuth>} />

      <Route path="/resident/directory" element={<RequireAuth roles={["RESIDENT"]}><ResidentDirectory /></RequireAuth>} />

      <Route path="/resident/notifications" element={<RequireAuth roles={["RESIDENT"]}><ResidentNotifications /></RequireAuth>} />



      <Route path="/security" element={<RequireAuth roles={["SECURITY", "ADMIN"]}><SecurityDashboard /></RequireAuth>} />



      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>

  );

}

