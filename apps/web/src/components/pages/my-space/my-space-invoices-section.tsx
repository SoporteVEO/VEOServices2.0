"use client";

import { useMySalesByCostCenterReport } from "@/api/analytics/analytics.get";
import { SalesByCostCenterReport } from "@/components/pages/analytics/sales-by-cost-center-report";
import { MY_SPACE_NAV_ITEMS } from "./const";
import { useMySpaceViewAs } from "./my-space-view-as-context";

const invoicesNav = MY_SPACE_NAV_ITEMS.find((item) =>
  item.href.endsWith("/invoices"),
)!;

export function MySpaceInvoicesSection() {
  const { viewAsUserId } = useMySpaceViewAs();

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="shrink-0 space-y-0.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {invoicesNav.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {invoicesNav.description}
        </p>
      </header>
      <SalesByCostCenterReport
        useReportQuery={useMySalesByCostCenterReport}
        showHeader={false}
        viewAsUserId={viewAsUserId}
      />
    </section>
  );
}
