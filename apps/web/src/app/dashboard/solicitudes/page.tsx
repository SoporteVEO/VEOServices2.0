import { Suspense } from "react";
import { FeatureRequestsPage } from "@/components/pages/feature-requests";

export default function SolicitudesPage() {
  return (
    <Suspense>
      <FeatureRequestsPage />
    </Suspense>
  );
}
