import { AdminShell } from "@/components/AdminShell";
import AdminExamAttemptsScreen from "@/components/screens/AdminExamAttemptsScreen";

export default function Page() {
  return (
    <AdminShell crumb="Exam Attempts">
      <AdminExamAttemptsScreen />
    </AdminShell>
  );
}
