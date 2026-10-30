import { AdminShell } from "@/components/AdminShell";
import AdminUsersScreen from "@/components/screens/AdminUsersScreen";

export default function Page() {
  return (
    <AdminShell crumb="Users">
      <AdminUsersScreen />
    </AdminShell>
  );
}
