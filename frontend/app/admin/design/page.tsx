import { AdminShell } from "@/components/AdminShell";
import AdminDesignScreen from "@/components/screens/AdminDesignScreen";

export default function Page() {
  return (
    <AdminShell crumb="Design">
      <AdminDesignScreen />
    </AdminShell>
  );
}
