import { Suspense } from "react";
import { MarketingFooter, MarketingHeader } from "@/components/MarketingChrome";
import VerifyScreen from "@/components/screens/VerifyScreen";

// Public certificate verification: /verify?serial=CCSF-4KQ2-8XF1-9MT3.
// useSearchParams() needs a Suspense boundary for the static export.
export default function Page() {
  return (
    <>
      <MarketingHeader />
      <Suspense fallback={null}>
        <VerifyScreen />
      </Suspense>
      <MarketingFooter />
    </>
  );
}
