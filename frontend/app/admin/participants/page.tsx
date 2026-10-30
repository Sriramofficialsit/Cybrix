import { AdminShell } from "@/components/AdminShell";
import AdminParticipantsScreen from "@/components/screens/AdminParticipantsScreen";

export default function Page() {
  return (
    <AdminShell crumb="Participants">
      <AdminParticipantsScreen />
    </AdminShell>
  );
}
