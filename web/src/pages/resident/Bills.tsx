import { MaintenancePayments } from "../../components/MaintenancePayments";
import { Shell } from "../../components/Shell";
import { RESIDENT_NAV } from "../../lib/nav";

export default function ResidentBills() {
  return (
    <Shell title="My Payments" nav={RESIDENT_NAV}>
      <MaintenancePayments />
    </Shell>
  );
}
