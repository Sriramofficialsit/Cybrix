import { AdminShell } from "@/components/AdminShell";
import AdminLiveEventsScreen from "@/components/screens/AdminLiveEventsScreen";

export default function Page() {
  return (
    <AdminShell crumb="Live Events">
      <AdminLiveEventsScreen />
    </AdminShell>
  );
}
