import { Suspense } from "react";
import LessonScreen from "@/components/screens/networking/LessonScreen";

// Topics without a purpose-built lesson: /learn/modules/networking/lesson?topic=2-1&stage=story
export default function Page() {
  return (
    <Suspense fallback={null}>
      <LessonScreen />
    </Suspense>
  );
}
