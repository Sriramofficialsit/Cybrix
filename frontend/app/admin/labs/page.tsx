import { AdminShell } from "@/components/AdminShell";
import AdminLabsScreen from "@/components/screens/AdminLabsScreen";

export default function Page() {
  return (
    <AdminShell crumb="Labs">
      <AdminLabsScreen />
    </AdminShell>
  );
}
