"use client";

import { MY_SPACE_NAV_ITEMS } from "./const";
import { MyProductionOrdersTable } from "./my-production-orders-table";

const nav = MY_SPACE_NAV_ITEMS.find((item) =>
  item.href.endsWith("/production-orders"),
)!;

export function MySpaceProductionOrdersSection() {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="flex shrink-0 flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{nav.title}</h1>
        {nav.description ? (
          <p className="text-sm text-muted-foreground">{nav.description}</p>
        ) : null}
      </header>
      <MyProductionOrdersTable />
    </section>
  );
}
