import { AdminShell } from "@/components/AdminShell";
import AdminSubmissionsScreen from "@/components/screens/AdminSubmissionsScreen";

export default function Page() {
  return (
    <AdminShell crumb="Submissions">
      <AdminSubmissionsScreen />
    </AdminShell>
  );
}
