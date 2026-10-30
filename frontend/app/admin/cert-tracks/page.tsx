import { AdminShell } from "@/components/AdminShell";
import AdminCertTracksScreen from "@/components/screens/AdminCertTracksScreen";

export default function Page() {
  return (
    <AdminShell crumb="Cert Tracks">
      <AdminCertTracksScreen />
    </AdminShell>
  );
}
