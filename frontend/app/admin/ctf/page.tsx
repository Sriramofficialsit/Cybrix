import { AdminShell } from "@/components/AdminShell";
import AdminCtfScreen from "@/components/screens/AdminCtfScreen";

export default function Page() {
  return (
    <AdminShell crumb="CTF / Tasks">
      <AdminCtfScreen />
    </AdminShell>
  );
}
