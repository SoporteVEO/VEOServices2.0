import { Suspense } from "react";
import { ProductionPage } from "@/components/pages/production/production-page";

export default function ProductionRoutePage() {
  return (
    <Suspense>
      <ProductionPage />
    </Suspense>
  );
}
