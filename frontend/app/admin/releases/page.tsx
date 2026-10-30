import { AdminShell } from "@/components/AdminShell";
import AdminReleasesScreen from "@/components/screens/AdminReleasesScreen";

export default function Page() {
  return (
    <AdminShell crumb="Releases">
      <AdminReleasesScreen />
    </AdminShell>
  );
}
