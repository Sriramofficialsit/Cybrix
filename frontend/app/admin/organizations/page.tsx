import { AdminShell } from "@/components/AdminShell";
import AdminOrganizationsScreen from "@/components/screens/AdminOrganizationsScreen";

export default function Page() {
  return (
    <AdminShell crumb="Organizations">
      <AdminOrganizationsScreen />
    </AdminShell>
  );
}
