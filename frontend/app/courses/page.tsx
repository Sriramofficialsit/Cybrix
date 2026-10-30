import { SiteHeader, SiteFooter } from "@/components/landing/SiteChrome";
import CoursesScreen from "@/components/screens/CoursesScreen";

export default function Page() {
  return (
    <div className="lp">
      <SiteHeader active="Courses" />
      <CoursesScreen />
      <SiteFooter />
    </div>
  );
}
