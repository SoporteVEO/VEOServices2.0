import { Suspense } from "react";
import { FeatureRequestsDevTable } from "@/components/pages/feature-requests";

export default function SolicitudesDesarrolloPage() {
  return (
    <section className="flex h-[calc(100vh-6rem)] min-h-0 flex-col gap-3">
      <Suspense>
        <FeatureRequestsDevTable />
      </Suspense>
    </section>
  );
}
