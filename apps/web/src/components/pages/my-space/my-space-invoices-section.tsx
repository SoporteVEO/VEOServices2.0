"use client";

import { useMySalesByCostCenterReport } from "@/api/analytics/analytics.get";
import { SalesByCostCenterReport } from "@/components/pages/analytics/sales-by-cost-center-report";
import { useMySpaceViewAs } from "./my-space-view-as-context";

export function MySpaceInvoicesSection() {
  const { viewAsUserId } = useMySpaceViewAs();

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <SalesByCostCenterReport
        useReportQuery={useMySalesByCostCenterReport}
        viewAsUserId={viewAsUserId}
      />
    </section>
  );
}
