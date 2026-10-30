import { AdminShell } from "@/components/AdminShell";
import AdminCertificatesScreen from "@/components/screens/AdminCertificatesScreen";

export default function Page() {
  return (
    <AdminShell crumb="Certificates">
      <AdminCertificatesScreen />
    </AdminShell>
  );
}
