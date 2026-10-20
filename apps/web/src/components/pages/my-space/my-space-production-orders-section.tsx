"use client";

import { MyProductionOrdersTable } from "./my-production-orders-table";

export function MySpaceProductionOrdersSection() {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <MyProductionOrdersTable />
    </section>
  );
}
