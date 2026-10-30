import { AdminShell } from "@/components/AdminShell";
import AdminRangeScreen from "@/components/screens/AdminRangeScreen";

export default function Page() {
  return (
    <AdminShell crumb="Cyber Range">
      <AdminRangeScreen />
    </AdminShell>
  );
}
