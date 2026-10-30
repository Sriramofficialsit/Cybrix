import { AdminShell } from "@/components/AdminShell";
import AdminOverviewScreen from "@/components/screens/AdminOverviewScreen";

export default function Page() {
  return (
    <AdminShell crumb="Overview">
      <AdminOverviewScreen />
    </AdminShell>
  );
}
