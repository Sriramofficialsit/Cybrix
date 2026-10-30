import { AdminShell } from "@/components/AdminShell";
import AdminCommunityScreen from "@/components/screens/AdminCommunityScreen";

export default function Page() {
  return (
    <AdminShell crumb="Community">
      <AdminCommunityScreen />
    </AdminShell>
  );
}
